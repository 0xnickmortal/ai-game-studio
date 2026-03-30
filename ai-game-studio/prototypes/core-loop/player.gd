# PROTOTYPE - NOT FOR PRODUCTION
extends CharacterBody2D

signal ingredient_picked_up(element: int)
signal wants_to_fire(dish: Dictionary, pos: Vector2, target_pos: Vector2)
signal wants_to_fire_basic(pos: Vector2, target_pos: Vector2)
signal wants_to_cook()
signal player_hit(damage: float)
signal leveled_up()
signal xp_changed(current: int, needed: int)

const BASE_SPEED = 200.0
const DODGE_SPEED = 450.0
const DODGE_DURATION = 0.3
const BASE_FIRE_INTERVAL = 0.6
const DISH_FIRE_INTERVAL = 1.2
const FIRE_RANGE = 300.0
const PICKUP_RANGE = 35.0
const XP_GEM_PICKUP = 8.0

var move_speed: float = 200.0
var base_damage: float = 8.0
var fire_interval: float = 0.6
var dodge_cooldown_max: float = 1.5
var proj_speed_mult: float = 1.0
var pickup_magnet_range: float = 60.0
var max_backpack: int = 6

var backpack: Array = []
var equipment_slots: Array = [{}, {}, {}, {}]
var hp: float = 100.0
var max_hp: float = 100.0
var is_dodging: bool = false
var dodge_timer: float = 0.0
var dodge_cooldown_timer: float = 0.0
var dodge_direction: Vector2 = Vector2.ZERO
var near_station: bool = false
var invincible: bool = false
var e_was_pressed: bool = false
var space_was_pressed: bool = false

var basic_fire_timer: float = 0.0
var dish_fire_timers: Array = [0.0, 0.0, 0.0, 0.0]

var xp: int = 0
var level: int = 1
var xp_to_next: int = 5

var facing: Vector2 = Vector2.RIGHT
var walk_bob: float = 0.0
var flash_timer: float = 0.0
var dodge_trail: Array = []
var level_flash: float = 0.0
var time: float = 0.0
var main_sprite: Sprite2D = null
var shadow_sprite: Sprite2D = null
var use_svg: bool = false

func _ready() -> void:
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	rect.size = Vector2(18, 22)
	shape.shape = rect
	add_child(shape)
	collision_layer = 1
	collision_mask = 2

	# Try SVG sprites, fall back to procedural _draw
	main_sprite = SpriteFactory.make_sprite_with_outline("res://assets/svg/chef.svg", Color(0.3, 0.28, 0.35), 2.0)
	if main_sprite and main_sprite.texture:
		use_svg = true
		main_sprite.offset = Vector2(0, -8)
		add_child(main_sprite)
		shadow_sprite = SpriteFactory.make_shadow("res://assets/svg/chef.svg", 2.0)
		if shadow_sprite:
			shadow_sprite.z_index = -1
			add_child(shadow_sprite)

func _process(delta: float) -> void:
	time += delta
	_check_pickups()
	_check_xp_gems()
	_check_station()
	_update_auto_fire(delta)
	_poll_keys()
	flash_timer = maxf(flash_timer - delta, 0.0)
	level_flash = maxf(level_flash - delta, 0.0)

	if velocity.length() > 10:
		walk_bob += delta * 14.0
		facing = velocity.normalized()
	else:
		walk_bob *= 0.9

	if is_dodging:
		dodge_trail.append({"pos": global_position, "alpha": 0.6})
	var new_trail: Array = []
	for t in dodge_trail:
		t.alpha -= delta * 2.5
		if t.alpha > 0.0:
			new_trail.append(t)
	dodge_trail = new_trail

	# SVG sprite updates
	if use_svg and main_sprite:
		# Bob
		main_sprite.offset.y = -8 + sin(walk_bob) * 1.5
		# Flip based on facing
		main_sprite.flip_h = facing.x < -0.1
		# Hit flash via shader
		if flash_timer > 0.0:
			SpriteFactory.apply_hit_flash(main_sprite, flash_timer / 0.2)
		else:
			SpriteFactory.apply_hit_flash(main_sprite, 0.0)
		# Dodge transparency
		if invincible:
			main_sprite.modulate = Color(0.6, 0.85, 1.0, 0.7)
		else:
			main_sprite.modulate = Color.WHITE

	queue_redraw()

func _draw() -> void:
	# === Effects overlay (always drawn) ===
	# Dodge trail
	for t in dodge_trail:
		_draw_chef_ghost(t.pos - global_position, t.alpha)

	# Level-up burst
	if level_flash > 0.0:
		for i in 8:
			var a = i * TAU / 8 + time
			var r = 25 * (1.0 - level_flash) + 10
			var p = Vector2(cos(a) * r, sin(a) * r)
			DrawUtil.circ(self, p, 3 * level_flash, Color(1, 0.9, 0.3, level_flash * 0.6))

	# Station prompt
	if near_station:
		draw_rect(Rect2(-22, -42, 44, 16), Color(0, 0, 0, 0.6))
		draw_string(ThemeDB.fallback_font, Vector2(-18, -30), "[E] Cook", 0, -1, 11, Color(1, 0.9, 0.3))

	# Level badge
	var bob_fx = sin(walk_bob) * 1.5
	DrawUtil.circ(self, Vector2(10, -8 + bob_fx), 6, Color(0.2, 0.15, 0.3, 0.8))
	draw_string(ThemeDB.fallback_font, Vector2(7, -5 + bob_fx), str(level), 0, -1, 9, Color(1, 0.85, 0.3))

	# If SVG loaded, skip procedural body
	if use_svg:
		return

	# === Procedural fallback ===
	var bob = sin(walk_bob) * 1.5
	var lean_x = facing.x * 1.5

	# Shadow
	DrawUtil.ellipse(self, Vector2(0, 14), Vector2(11, 4), Color(0, 0, 0, 0.35))

	# Determine body color
	var coat = Color(0.92, 0.92, 0.88)
	var outline_c = Color(0.3, 0.28, 0.35)
	if flash_timer > 0.0:
		coat = Color(1, 0.4, 0.35)
		outline_c = Color(0.8, 0.2, 0.2)
	if invincible:
		coat = Color(0.6, 0.85, 1.0, 0.75)
		outline_c = Color(0.3, 0.5, 0.8, 0.75)

	# Legs
	var leg_a = sin(walk_bob * 0.8) * 4.0
	draw_line(Vector2(-4 + lean_x, 9 + bob), Vector2(-6 + leg_a, 15), outline_c, 3)
	draw_line(Vector2(4 + lean_x, 9 + bob), Vector2(6 - leg_a, 15), outline_c, 3)
	# Shoes
	DrawUtil.circ(self, Vector2(-6 + leg_a, 15), 2.5, Color(0.25, 0.2, 0.15))
	DrawUtil.circ(self, Vector2(6 - leg_a, 15), 2.5, Color(0.25, 0.2, 0.15))

	# Body outline
	_draw_rounded_rect(Vector2(-8 + lean_x, -9 + bob), Vector2(16, 20), outline_c)
	# Body fill
	_draw_rounded_rect(Vector2(-7 + lean_x, -8 + bob), Vector2(14, 18), coat)

	# Apron
	var apron_pts = PackedVector2Array([
		Vector2(-5 + lean_x, -1 + bob),
		Vector2(5 + lean_x, -1 + bob),
		Vector2(6 + lean_x, 10 + bob),
		Vector2(-6 + lean_x, 10 + bob),
	])
	DrawUtil.poly(self, apron_pts, Color(0.95, 0.93, 0.88))
	# Apron ties
	draw_line(Vector2(-5 + lean_x, -1 + bob), Vector2(-8 + lean_x, 2 + bob), Color(0.85, 0.83, 0.78), 1)
	draw_line(Vector2(5 + lean_x, -1 + bob), Vector2(8 + lean_x, 2 + bob), Color(0.85, 0.83, 0.78), 1)
	# Apron pocket
	draw_rect(Rect2(-3 + lean_x, 3 + bob, 6, 5), Color(0.88, 0.85, 0.8))

	# Arms
	var arm_swing = sin(walk_bob * 0.8) * 3
	draw_line(Vector2(-8 + lean_x, -3 + bob), Vector2(-12 + lean_x - arm_swing, 5 + bob), coat, 3)
	draw_line(Vector2(8 + lean_x, -3 + bob), Vector2(12 + lean_x + arm_swing, 5 + bob), coat, 3)
	# Hands
	DrawUtil.circ(self, Vector2(-12 + lean_x - arm_swing, 5 + bob), 2.5, Color(0.9, 0.78, 0.65))
	DrawUtil.circ(self, Vector2(12 + lean_x + arm_swing, 5 + bob), 2.5, Color(0.9, 0.78, 0.65))

	# Head (skin)
	DrawUtil.ellipse(self, Vector2(lean_x, -12 + bob), Vector2(7, 6), Color(0.92, 0.8, 0.68))
	# Head outline
	for i in 20:
		var a = i * TAU / 20
		var na = (i + 1) * TAU / 20
		var p1 = Vector2(lean_x + cos(a) * 7, -12 + bob + sin(a) * 6)
		var p2 = Vector2(lean_x + cos(na) * 7, -12 + bob + sin(na) * 6)
		draw_line(p1, p2, outline_c, 1)

	# Chef hat
	var hat_base_y = -17 + bob
	# Hat brim
	DrawUtil.ellipse(self, Vector2(lean_x, hat_base_y), Vector2(10, 3), Color.WHITE)
	# Hat body
	var hat_pts = PackedVector2Array([
		Vector2(-7 + lean_x, hat_base_y),
		Vector2(-6 + lean_x, hat_base_y - 14),
		Vector2(-2 + lean_x, hat_base_y - 16),
		Vector2(2 + lean_x, hat_base_y - 16),
		Vector2(6 + lean_x, hat_base_y - 14),
		Vector2(7 + lean_x, hat_base_y),
	])
	DrawUtil.poly(self, hat_pts, Color(0.98, 0.98, 0.96))
	# Hat puff (top)
	DrawUtil.circ(self, Vector2(-3 + lean_x, hat_base_y - 13), 4, Color(0.99, 0.99, 0.97))
	DrawUtil.circ(self, Vector2(3 + lean_x, hat_base_y - 14), 3.5, Color(0.98, 0.98, 0.96))
	DrawUtil.circ(self, Vector2(lean_x, hat_base_y - 15), 4, Color(1, 1, 0.98))
	# Hat band
	draw_line(Vector2(-8 + lean_x, hat_base_y + 1), Vector2(8 + lean_x, hat_base_y + 1), Color(0.8, 0.15, 0.15), 2)

	# Eyes
	var ex = facing.x * 2
	var ey = facing.y * 1
	# White
	DrawUtil.ellipse(self, Vector2(-3 + lean_x + ex * 0.3, -13 + bob + ey * 0.3), Vector2(2.5, 2.5), Color.WHITE)
	DrawUtil.ellipse(self, Vector2(3 + lean_x + ex * 0.3, -13 + bob + ey * 0.3), Vector2(2.5, 2.5), Color.WHITE)
	# Pupils
	DrawUtil.circ(self, Vector2(-3 + lean_x + ex, -13 + bob + ey), 1.2, Color(0.12, 0.1, 0.15))
	DrawUtil.circ(self, Vector2(3 + lean_x + ex, -13 + bob + ey), 1.2, Color(0.12, 0.1, 0.15))

	# Mouth (small smile)
	draw_line(Vector2(-2 + lean_x, -9 + bob), Vector2(2 + lean_x, -9 + bob), Color(0.6, 0.35, 0.3), 1)

	# Cheeks (blush)
	DrawUtil.circ(self, Vector2(-5 + lean_x, -10 + bob), 2, Color(0.95, 0.6, 0.55, 0.3))
	DrawUtil.circ(self, Vector2(5 + lean_x, -10 + bob), 2, Color(0.95, 0.6, 0.55, 0.3))

	# Station prompt
	if near_station:
		# Bubble background
		draw_rect(Rect2(-22, -42, 44, 16), Color(0, 0, 0, 0.6))
		draw_string(ThemeDB.fallback_font, Vector2(-18, -30), "[E] Cook", 0, -1, 11, Color(1, 0.9, 0.3))

	# Level badge (small circle)
	DrawUtil.circ(self, Vector2(10, -8 + bob), 6, Color(0.2, 0.15, 0.3, 0.8))
	draw_string(ThemeDB.fallback_font, Vector2(7, -5 + bob), str(level), 0, -1, 9, Color(1, 0.85, 0.3))

func _draw_chef_ghost(offset: Vector2, alpha: float) -> void:
	var c = Color(0.5, 0.8, 1.0, alpha * 0.25)
	DrawUtil.ellipse(self, offset + Vector2(0, 0), Vector2(8, 12), c)
	DrawUtil.circ(self, offset + Vector2(0, -14), 6, Color(0.6, 0.85, 1.0, alpha * 0.2))

func _draw_rounded_rect(pos: Vector2, size: Vector2, color: Color) -> void:
	var r = 3.0
	var pts = PackedVector2Array()
	# Top-left
	pts.append(pos + Vector2(r, 0))
	pts.append(pos + Vector2(size.x - r, 0))
	# Top-right
	pts.append(pos + Vector2(size.x, r))
	pts.append(pos + Vector2(size.x, size.y - r))
	# Bottom-right
	pts.append(pos + Vector2(size.x - r, size.y))
	pts.append(pos + Vector2(r, size.y))
	# Bottom-left
	pts.append(pos + Vector2(0, size.y - r))
	pts.append(pos + Vector2(0, r))
	draw_colored_polygon(pts, color)

func _physics_process(delta: float) -> void:
	if is_dodging:
		dodge_timer -= delta
		velocity = dodge_direction * DODGE_SPEED
		if dodge_timer <= 0.0:
			is_dodging = false
			invincible = false
	else:
		var input = Vector2.ZERO
		if Input.is_key_pressed(KEY_W):
			input.y -= 1
		if Input.is_key_pressed(KEY_S):
			input.y += 1
		if Input.is_key_pressed(KEY_A):
			input.x -= 1
		if Input.is_key_pressed(KEY_D):
			input.x += 1
		velocity = input.normalized() * move_speed
	dodge_cooldown_timer = maxf(dodge_cooldown_timer - delta, 0.0)
	move_and_slide()

func _check_pickups() -> void:
	if backpack.size() >= max_backpack:
		return
	var tree = get_tree()
	if not tree:
		return
	for ing in tree.get_nodes_in_group("ingredients"):
		if not is_instance_valid(ing):
			continue
		if global_position.distance_to(ing.global_position) < PICKUP_RANGE:
			backpack.append(ing.element)
			ingredient_picked_up.emit(ing.element)
			ing.remove_from_group("ingredients")
			ing.visible = false
			ing.queue_free()
			return

func _check_xp_gems() -> void:
	var tree = get_tree()
	if not tree:
		return
	for gem in tree.get_nodes_in_group("xp_gems"):
		if not is_instance_valid(gem):
			continue
		if global_position.distance_to(gem.global_position) < XP_GEM_PICKUP:
			_gain_xp(gem.xp_value)
			gem.remove_from_group("xp_gems")
			gem.queue_free()

func _gain_xp(amount: int) -> void:
	xp += amount
	xp_changed.emit(xp, xp_to_next)
	while xp >= xp_to_next:
		xp -= xp_to_next
		level += 1
		xp_to_next = 3 + level * 3
		level_flash = 1.0
		leveled_up.emit()
		xp_changed.emit(xp, xp_to_next)

func apply_upgrade(upgrade: Dictionary) -> void:
	match upgrade.stat:
		"fire_rate": fire_interval *= upgrade.value
		"damage": base_damage += upgrade.value
		"speed": move_speed *= upgrade.value
		"magnet": pickup_magnet_range += upgrade.value
		"max_hp":
			max_hp += upgrade.value
			hp = min(hp + upgrade.value, max_hp)
		"backpack": max_backpack += upgrade.value
		"dodge_cd": dodge_cooldown_max *= upgrade.value
		"proj_speed": proj_speed_mult *= upgrade.value

func _check_station() -> void:
	var tree = get_tree()
	if not tree:
		return
	near_station = false
	for s in tree.get_nodes_in_group("stations"):
		if is_instance_valid(s) and global_position.distance_to(s.global_position) < 50.0:
			near_station = true
			return

func _update_auto_fire(delta: float) -> void:
	var nearest = _find_nearest_enemy()
	if nearest == null:
		return
	var target_pos = nearest.global_position
	basic_fire_timer -= delta
	if basic_fire_timer <= 0.0:
		wants_to_fire_basic.emit(global_position, target_pos)
		basic_fire_timer = fire_interval
	for i in equipment_slots.size():
		dish_fire_timers[i] -= delta
		if not equipment_slots[i].is_empty() and dish_fire_timers[i] <= 0.0:
			wants_to_fire.emit(equipment_slots[i], global_position, target_pos)
			dish_fire_timers[i] = DISH_FIRE_INTERVAL

func _find_nearest_enemy() -> Node2D:
	var parent = get_parent()
	if not parent:
		return null
	var nearest: Node2D = null
	var best: float = FIRE_RANGE
	for child in parent.get_children():
		if child == self or not child is CharacterBody2D:
			continue
		if not child.has_method("take_damage") or not is_instance_valid(child):
			continue
		var d = global_position.distance_to(child.global_position)
		if d < best:
			best = d
			nearest = child
	return nearest

func _poll_keys() -> void:
	var e_now = Input.is_key_pressed(KEY_E)
	if e_now and not e_was_pressed:
		if near_station:
			wants_to_cook.emit()
	e_was_pressed = e_now
	var space_now = Input.is_key_pressed(KEY_SPACE)
	if space_now and not space_was_pressed:
		if not is_dodging and dodge_cooldown_timer <= 0.0:
			_start_dodge()
	space_was_pressed = space_now

func _start_dodge() -> void:
	var input = Vector2.ZERO
	if Input.is_key_pressed(KEY_D): input.x += 1
	if Input.is_key_pressed(KEY_A): input.x -= 1
	if Input.is_key_pressed(KEY_S): input.y += 1
	if Input.is_key_pressed(KEY_W): input.y -= 1
	dodge_direction = input.normalized() if input.length() > 0.1 else Vector2.RIGHT
	is_dodging = true
	invincible = true
	dodge_timer = DODGE_DURATION
	dodge_cooldown_timer = dodge_cooldown_max

func equip_dish(dish: Dictionary) -> bool:
	for i in equipment_slots.size():
		if equipment_slots[i].is_empty():
			equipment_slots[i] = dish
			return true
	return false

func take_damage(amount: float) -> void:
	if invincible:
		return
	hp -= amount
	flash_timer = 0.2
	player_hit.emit(amount)
	if hp <= 0:
		hp = max_hp
		backpack.clear()
		equipment_slots = [{}, {}, {}, {}]
		global_position = Vector2(480, 270)

func heal(amount: float) -> void:
	hp = minf(hp + amount, max_hp)
