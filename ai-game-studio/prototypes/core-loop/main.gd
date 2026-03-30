# PROTOTYPE - NOT FOR PRODUCTION
# Question: Does the collect-cook-fight loop feel fun?
# Date: 2026-03-29

extends Node2D

const ARENA_SIZE = Vector2(960, 540)
const ARENA_MARGIN = 60.0
const MAX_ENEMIES_BASE = 6
const SPAWN_INTERVAL_BASE = 3.5
const ENEMIES_PER_MINUTE = 2
const MIN_SPAWN_INTERVAL = 1.0
const MAX_ENEMIES_CAP = 20

var player: CharacterBody2D
var cooking_ui: CanvasLayer
var level_up_ui: CanvasLayer
var hud: CanvasLayer
var station: Node2D
var spawn_timer: float = 0.0
var enemy_count: int = 0
var game_time: float = 0.0

# Screen shake
var shake_amount: float = 0.0
var shake_decay: float = 8.0

func _ready() -> void:
	_create_arena_floor()

	var border = _create_arena_walls()
	add_child(border)

	station = Node2D.new()
	station.set_script(load("res://cooking_station.gd"))
	station.position = Vector2(700, 270)
	add_child(station)

	player = CharacterBody2D.new()
	player.set_script(load("res://player.gd"))
	player.position = Vector2(200, 270)
	add_child(player)

	player.wants_to_fire.connect(_on_player_fire_dish)
	player.wants_to_fire_basic.connect(_on_player_fire_basic)
	player.wants_to_cook.connect(_on_player_wants_cook)
	player.player_hit.connect(_on_player_hit)
	player.leveled_up.connect(_on_player_leveled_up)
	player.xp_changed.connect(_on_xp_changed)

	hud = CanvasLayer.new()
	hud.set_script(load("res://hud.gd"))
	add_child(hud)

	cooking_ui = CanvasLayer.new()
	cooking_ui.set_script(load("res://cooking_ui.gd"))
	cooking_ui.layer = 10
	add_child(cooking_ui)
	cooking_ui.dish_cooked.connect(_on_dish_cooked)
	cooking_ui.cooking_closed.connect(_on_cooking_closed)

	level_up_ui = CanvasLayer.new()
	level_up_ui.set_script(load("res://level_up_ui.gd"))
	level_up_ui.layer = 11
	add_child(level_up_ui)
	level_up_ui.choice_made.connect(_on_upgrade_chosen)

	for i in 4:
		_spawn_enemy()

	_update_hud()

func _process(delta: float) -> void:
	if shake_amount > 0:
		shake_amount = maxf(shake_amount - shake_decay * delta, 0)
		position = Vector2(randf_range(-shake_amount, shake_amount), randf_range(-shake_amount, shake_amount))
	else:
		position = Vector2.ZERO

func _physics_process(delta: float) -> void:
	game_time += delta
	var minutes = game_time / 60.0
	var max_enemies = mini(MAX_ENEMIES_BASE + int(minutes * ENEMIES_PER_MINUTE), MAX_ENEMIES_CAP)
	var spawn_interval = maxf(SPAWN_INTERVAL_BASE - minutes * 0.3, MIN_SPAWN_INTERVAL)

	spawn_timer += delta
	if spawn_timer >= spawn_interval and enemy_count < max_enemies:
		_spawn_enemy()
		if minutes > 2.0 and randf() < 0.3:
			_spawn_enemy()
		spawn_timer = 0.0

	hud.update_timer(game_time)
	_update_hud()

func _spawn_enemy() -> void:
	var enemy = CharacterBody2D.new()
	enemy.set_script(load("res://enemy.gd"))

	# Pick enemy type based on game time
	var minutes = game_time / 60.0
	var roll = randf()
	if minutes > 3.0 and roll < 0.15:
		enemy.enemy_type = "tank"
	elif minutes > 1.5 and roll < 0.35:
		enemy.enemy_type = "fast"
	elif minutes > 2.0 and roll < 0.5:
		enemy.enemy_type = "ranged"
	else:
		enemy.enemy_type = "normal"

	var side = randi() % 4
	var pos = Vector2.ZERO
	match side:
		0: pos = Vector2(randf_range(ARENA_MARGIN, ARENA_SIZE.x - ARENA_MARGIN), ARENA_MARGIN)
		1: pos = Vector2(randf_range(ARENA_MARGIN, ARENA_SIZE.x - ARENA_MARGIN), ARENA_SIZE.y - ARENA_MARGIN)
		2: pos = Vector2(ARENA_MARGIN, randf_range(ARENA_MARGIN, ARENA_SIZE.y - ARENA_MARGIN))
		3: pos = Vector2(ARENA_SIZE.x - ARENA_MARGIN, randf_range(ARENA_MARGIN, ARENA_SIZE.y - ARENA_MARGIN))

	enemy.position = pos
	enemy.target = player
	enemy.element_bias = randi_range(0, 5)

	# Scale stats with time
	var hp_mult = 1.0 + minutes * 0.25
	var speed_mult = 1.0 + minutes * 0.08
	enemy.hp = 40.0 * hp_mult
	enemy.max_hp = enemy.hp
	enemy.SPEED = 80.0 * speed_mult

	enemy.died.connect(_on_enemy_died)
	add_child(enemy)
	enemy_count += 1

func _on_enemy_died(pos: Vector2, drops: Array, xp: int) -> void:
	enemy_count -= 1
	hud.add_kill()
	shake_amount = 3.0

	_spawn_death_particles(pos)

	# Spawn ingredients
	for i in drops.size():
		var offset = Vector2(randf_range(-25, 25), randf_range(-25, 25))
		var ing = Node2D.new()
		ing.set_script(load("res://ingredient.gd"))
		ing.element = drops[i]
		ing.position = pos + offset
		add_child(ing)

	# Spawn XP gem
	var gem = Node2D.new()
	gem.set_script(load("res://xp_gem.gd"))
	gem.xp_value = xp
	gem.position = pos
	gem.target = player
	add_child(gem)

func _spawn_death_particles(pos: Vector2) -> void:
	# Sparks
	for i in 6:
		var p = Node2D.new()
		p.set_script(load("res://particle.gd"))
		p.position = pos
		p.color = Color(1, 0.7, 0.2, 1)
		p.dir = Vector2(randf_range(-1, 1), randf_range(-1, 1)).normalized()
		p.spd = randf_range(100, 200)
		p.size = randf_range(2, 4)
		p.fade_type = 1
		p.lifetime = 0.4
		add_child(p)
	# Smoke puffs
	for i in 3:
		var p = Node2D.new()
		p.set_script(load("res://particle.gd"))
		p.position = pos + Vector2(randf_range(-5, 5), randf_range(-5, 5))
		p.color = Color(0.4, 0.35, 0.3, 0.3)
		p.dir = Vector2(randf_range(-0.3, 0.3), -1).normalized()
		p.spd = randf_range(20, 40)
		p.size = randf_range(6, 10)
		p.fade_type = 2
		p.lifetime = 0.8
		p.gravity = -20
		add_child(p)

func _spawn_damage_number(pos: Vector2, amount: float, color: Color, crit: bool) -> void:
	var dn = Node2D.new()
	dn.set_script(load("res://damage_number.gd"))
	dn.position = pos + Vector2(randf_range(-8, 8), -10)
	dn.amount = amount
	dn.color = color
	dn.is_crit = crit
	add_child(dn)

func _spawn_projectile(dir: Vector2, pos: Vector2, dmg: float, eff: String, col: Color, basic: bool) -> void:
	var proj = Area2D.new()
	proj.set_script(load("res://projectile.gd"))
	proj.direction = dir
	proj.damage = dmg
	proj.effect = eff
	proj.dish_color = col
	proj.is_basic = basic
	proj.speed = 400.0 * player.proj_speed_mult
	proj.position = pos + dir * 20
	add_child(proj)

func _on_player_fire_basic(pos: Vector2, target_pos: Vector2) -> void:
	var dir = (target_pos - pos).normalized()
	_spawn_projectile(dir, pos, player.base_damage, "none", Color(0.8, 0.8, 0.8), true)

func _on_player_fire_dish(dish: Dictionary, pos: Vector2, target_pos: Vector2) -> void:
	if dish.get("effect", "") == "heal":
		player.heal(30.0)
		_spawn_damage_number(player.global_position, 30, Color(0.2, 1, 0.4), false)
		return

	var dir = (target_pos - pos).normalized()
	var dmg: float = dish.get("damage", 15)
	var eff: String = dish.get("effect", "none")
	var col: Color = dish.get("color", Color.WHITE)
	_spawn_projectile(dir, pos, dmg, eff, col, false)

func _on_player_wants_cook() -> void:
	cooking_ui.open(player.backpack)

func _on_cooking_closed() -> void:
	pass

func _on_dish_cooked(dish: Dictionary, _ingredients_used: Array) -> void:
	var equipped: bool = player.equip_dish(dish)
	if not equipped:
		pass

func _on_player_hit(dmg: float) -> void:
	shake_amount = 5.0
	_spawn_damage_number(player.global_position, dmg, Color(1, 0.3, 0.3), false)
	var flash = ColorRect.new()
	flash.size = ARENA_SIZE
	flash.color = Color(1, 0, 0, 0.15)
	flash.z_index = 100
	add_child(flash)
	var tw = create_tween()
	tw.tween_property(flash, "modulate:a", 0.0, 0.4)
	tw.tween_callback(flash.queue_free)

func _on_player_leveled_up() -> void:
	level_up_ui.show_choices()

func _on_upgrade_chosen(choice: Dictionary) -> void:
	player.apply_upgrade(choice)

func _on_xp_changed(current: int, needed: int) -> void:
	hud.update_xp(current, needed, player.level)

func _update_hud() -> void:
	hud.update_hp(player.hp, player.max_hp)
	hud.update_backpack(player.backpack)
	hud.update_equipment(player.equipment_slots)

func _create_arena_floor() -> void:
	var bg = ColorRect.new()
	bg.size = ARENA_SIZE
	bg.color = Color(0.08, 0.08, 0.12)
	add_child(bg)

	var grid = Node2D.new()
	grid.set_script(load("res://arena_grid.gd"))
	add_child(grid)

func _create_arena_walls() -> StaticBody2D:
	var walls = StaticBody2D.new()
	walls.collision_layer = 0
	walls.collision_mask = 0
	_add_wall(walls, Vector2(ARENA_SIZE.x / 2, 0), Vector2(ARENA_SIZE.x, 20))
	_add_wall(walls, Vector2(ARENA_SIZE.x / 2, ARENA_SIZE.y), Vector2(ARENA_SIZE.x, 20))
	_add_wall(walls, Vector2(0, ARENA_SIZE.y / 2), Vector2(20, ARENA_SIZE.y))
	_add_wall(walls, Vector2(ARENA_SIZE.x, ARENA_SIZE.y / 2), Vector2(20, ARENA_SIZE.y))
	return walls

func _add_wall(parent: StaticBody2D, pos: Vector2, size: Vector2) -> void:
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = size
	shape.shape = rect
	shape.position = pos
	parent.add_child(shape)
	var visual = ColorRect.new()
	visual.size = size
	visual.position = pos - size / 2
	visual.color = Color(0.18, 0.16, 0.22)
	parent.add_child(visual)
