# PROTOTYPE - NOT FOR PRODUCTION
extends CharacterBody2D

signal died(pos: Vector2, drops: Array, xp: int)

var SPEED: float = 80.0
const CONTACT_COOLDOWN = 1.0
const CONTACT_RANGE = 22.0

var hp: float = 40.0
var max_hp: float = 40.0
var contact_damage: float = 10.0
var target: Node2D = null
var contact_timer: float = 0.0
var element_bias: int = -1
var is_dead: bool = false
var xp_reward: int = 1
var enemy_type: String = "normal"

var wobble: float = 0.0
var flash_timer: float = 0.0
var body_color: Color = Color(0.9, 0.2, 0.2)
var body_size: Vector2 = Vector2(10, 12)
var shoot_timer: float = 3.0
var shoot_interval: float = 3.0

func _ready() -> void:
	var shape = CollisionShape2D.new()
	var rect = RectangleShape2D.new()
	match enemy_type:
		"fast":
			SPEED *= 1.8
			hp *= 0.5
			max_hp = hp
			body_size = Vector2(7, 9)
			rect.size = Vector2(14, 14)
			contact_damage = 6.0
			xp_reward = 1
		"tank":
			SPEED *= 0.5
			hp *= 3.0
			max_hp = hp
			body_size = Vector2(16, 18)
			rect.size = Vector2(28, 28)
			contact_damage = 20.0
			xp_reward = 3
		"ranged":
			SPEED *= 0.7
			rect.size = Vector2(18, 18)
			xp_reward = 2
		_:
			rect.size = Vector2(18, 18)
	shape.shape = rect
	add_child(shape)
	collision_layer = 2
	collision_mask = 1

	if element_bias >= 0:
		body_color = GameData.ELEMENT_COLORS.get(element_bias, Color.RED)
		body_color = body_color.lerp(Color(0.15, 0.08, 0.12), 0.25)

	# Try SVG sprite
	var svg_map = {
		"normal": "res://assets/svg/enemy_normal.svg",
		"fast": "res://assets/svg/enemy_fast.svg",
		"tank": "res://assets/svg/enemy_tank.svg",
		"ranged": "res://assets/svg/enemy_ranged.svg",
	}
	var svg_path = svg_map.get(enemy_type, "res://assets/svg/enemy_normal.svg")
	var scale = 2.0 if enemy_type == "tank" else 1.5
	var spr = SpriteFactory.make_sprite_with_outline(svg_path, body_color.darkened(0.4), scale)
	if spr and spr.texture:
		spr.name = "SVGSprite"
		spr.modulate = body_color.lightened(0.2)
		add_child(spr)

func _process(delta: float) -> void:
	wobble += delta * 6.0
	flash_timer = maxf(flash_timer - delta, 0.0)
	# SVG hit flash
	var spr = get_node_or_null("SVGSprite")
	if spr:
		SpriteFactory.apply_hit_flash(spr, flash_timer / 0.12 if flash_timer > 0 else 0.0)
	queue_redraw()

func _draw() -> void:
	if is_dead:
		return
	var sq_x = 1.0 + sin(wobble) * 0.06
	var sq_y = 1.0 - sin(wobble) * 0.06
	var sx = body_size.x
	var sy = body_size.y
	var col = body_color if flash_timer <= 0.0 else Color.WHITE
	var dark = col.darkened(0.35)
	var light = col.lightened(0.25)

	# Shadow
	DrawUtil.ellipse(self, Vector2(0, sy + 3), Vector2(sx * 0.9, 3), Color(0, 0, 0, 0.3))

	match enemy_type:
		"fast":
			_draw_fast(sx, sy, sq_x, sq_y, col, dark, light)
		"tank":
			_draw_tank(sx, sy, sq_x, sq_y, col, dark, light)
		"ranged":
			_draw_ranged(sx, sy, sq_x, sq_y, col, dark, light)
		_:
			_draw_normal(sx, sy, sq_x, sq_y, col, dark, light)

	# Element badge
	var sym = GameData.ELEMENT_SYMBOLS.get(element_bias, "?")
	var badge_y = sy + 1
	DrawUtil.circ(self, Vector2(0, badge_y), 5, Color(0, 0, 0, 0.4))
	draw_string(ThemeDB.fallback_font, Vector2(-3, badge_y + 4), sym, 0, -1, 9, Color(1, 1, 1, 0.7))

	# HP bar
	if hp < max_hp:
		var bw = sx * 2.2
		var by = -sy - 8
		draw_rect(Rect2(-bw / 2 - 1, by - 1, bw + 2, 5), Color(0, 0, 0, 0.5))
		draw_rect(Rect2(-bw / 2, by, bw, 3), Color(0.2, 0.05, 0.05))
		draw_rect(Rect2(-bw / 2, by, bw * (hp / max_hp), 3), Color(0.9, 0.2, 0.1))

func _draw_normal(sx: float, sy: float, sqx: float, sqy: float, col: Color, dark: Color, light: Color) -> void:
	# Slime blob body
	DrawUtil.ellipse(self, Vector2(0, 2), Vector2(sx * sqx, sy * sqy * 0.7), dark)
	DrawUtil.ellipse(self, Vector2(0, -1), Vector2(sx * sqx, sy * sqy), col)
	# Highlight
	DrawUtil.ellipse(self, Vector2(-2, -sy * 0.4), Vector2(sx * 0.4, sy * 0.25), light)
	# Face
	_draw_eyes(0, -3 * sqy, 2.5)
	# Mouth
	draw_line(Vector2(-3, 2), Vector2(0, 4), Color(0.1, 0, 0, 0.5), 1)
	draw_line(Vector2(0, 4), Vector2(3, 2), Color(0.1, 0, 0, 0.5), 1)

func _draw_fast(sx: float, sy: float, sqx: float, sqy: float, col: Color, dark: Color, light: Color) -> void:
	# Spiky body with streaks
	var pts = PackedVector2Array()
	for i in 10:
		var a = i * TAU / 10 - PI / 2
		var r = sx * sqx * 1.2
		if i % 2 == 0:
			r *= 1.6
		pts.append(Vector2(cos(a) * r, sin(a) * r * sqy))
	DrawUtil.poly(self, pts, col)
	# Inner body
	DrawUtil.ellipse(self, Vector2(0, 0), Vector2(sx * 0.7, sy * 0.6), light)
	# Speed lines
	draw_line(Vector2(-sx - 6, -2), Vector2(-sx - 2, -2), Color(1, 1, 1, 0.3), 1)
	draw_line(Vector2(-sx - 8, 2), Vector2(-sx - 3, 2), Color(1, 1, 1, 0.2), 1)
	# Face
	_draw_eyes(0, -2, 2.0)

func _draw_tank(sx: float, sy: float, sqx: float, sqy: float, col: Color, dark: Color, light: Color) -> void:
	# Chunky armored body
	var body_pts = PackedVector2Array([
		Vector2(-sx * sqx, -sy * sqy),
		Vector2(sx * sqx, -sy * sqy),
		Vector2(sx * sqx * 1.1, 0),
		Vector2(sx * sqx, sy * sqy),
		Vector2(-sx * sqx, sy * sqy),
		Vector2(-sx * sqx * 1.1, 0),
	])
	DrawUtil.poly(self, body_pts, col)
	# Armor plate highlight
	draw_rect(Rect2(-sx * 0.7, -sy * 0.5, sx * 1.4, 3), light)
	draw_rect(Rect2(-sx * 0.7, sy * 0.2, sx * 1.4, 3), light)
	# Armor cross
	draw_line(Vector2(-sx * 0.3, -sy * 0.7), Vector2(-sx * 0.3, sy * 0.5), dark, 2)
	draw_line(Vector2(sx * 0.3, -sy * 0.7), Vector2(sx * 0.3, sy * 0.5), dark, 2)
	# Helmet visor
	draw_rect(Rect2(-sx * 0.5, -sy * 0.6, sx, 5), Color(0.1, 0.08, 0.15))
	# Angry eyes in visor
	DrawUtil.circ(self, Vector2(-4, -sy * 0.4), 2, Color(1, 0.3, 0.2))
	DrawUtil.circ(self, Vector2(4, -sy * 0.4), 2, Color(1, 0.3, 0.2))

func _draw_ranged(sx: float, sy: float, sqx: float, sqy: float, col: Color, dark: Color, light: Color) -> void:
	# Hovering eye-mage
	# Robe body
	var robe = PackedVector2Array([
		Vector2(-sx * sqx * 0.6, -sy * sqy),
		Vector2(sx * sqx * 0.6, -sy * sqy),
		Vector2(sx * sqx * 1.1, sy * sqy),
		Vector2(-sx * sqx * 1.1, sy * sqy),
	])
	draw_colored_polygon(robe, dark)
	# Inner robe
	var inner = PackedVector2Array([
		Vector2(-sx * sqx * 0.4, -sy * sqy * 0.6),
		Vector2(sx * sqx * 0.4, -sy * sqy * 0.6),
		Vector2(sx * sqx * 0.8, sy * sqy * 0.8),
		Vector2(-sx * sqx * 0.8, sy * sqy * 0.8),
	])
	draw_colored_polygon(inner, col)
	# Big central eye
	_draw_circ(Vector2(0, -3), 5, Color.WHITE)
	_draw_circ(Vector2(0, -2.5), 2.5, col.lightened(0.3))
	_draw_circ(Vector2(0, -2.5), 1.2, Color(0.05, 0, 0.1))
	# Eye glow
	_draw_circ(Vector2(0, -3), 7, Color(col.r, col.g, col.b, 0.15 + sin(wobble * 2) * 0.05))
	# Antennae
	var ant_sway = sin(wobble * 1.5) * 3
	draw_line(Vector2(-3, -sy), Vector2(-6 + ant_sway, -sy - 10), col, 1.5)
	draw_line(Vector2(3, -sy), Vector2(6 - ant_sway, -sy - 10), col, 1.5)
	_draw_circ(Vector2(-6 + ant_sway, -sy - 10), 2.5, light)
	_draw_circ(Vector2(6 - ant_sway, -sy - 10), 2.5, light)

func _draw_eyes(x: float, y: float, size: float) -> void:
	# White
	_draw_circ(Vector2(x - 4, y), size, Color.WHITE)
	_draw_circ(Vector2(x + 4, y), size, Color.WHITE)
	# Pupil
	_draw_circ(Vector2(x - 3.5, y + 0.5), size * 0.45, Color(0.08, 0, 0.05))
	_draw_circ(Vector2(x + 4.5, y + 0.5), size * 0.45, Color(0.08, 0, 0.05))
	# Angry brows
	draw_line(Vector2(x - 6, y - size - 1), Vector2(x - 2, y - size + 1), Color(0.15, 0.1, 0.1), 1.5)
	draw_line(Vector2(x + 6, y - size - 1), Vector2(x + 2, y - size + 1), Color(0.15, 0.1, 0.1), 1.5)

func _draw_circ(center: Vector2, radius: float, color: Color) -> void:
	if radius < 0.5 or color.a < 0.01:
		return
	DrawUtil.circ(self, center, radius, color)

func _draw_ellipse(center: Vector2, size: Vector2, color: Color) -> void:
	if size.x < 0.5 or size.y < 0.5 or color.a < 0.01:
		return
	DrawUtil.ellipse(self, center, size, color)

func _physics_process(delta: float) -> void:
	if is_dead:
		return
	contact_timer = maxf(contact_timer - delta, 0.0)
	if not target or not is_instance_valid(target):
		velocity = Vector2.ZERO
		move_and_slide()
		return
	var dist = global_position.distance_to(target.global_position)
	if enemy_type == "ranged":
		if dist < 120:
			velocity = (global_position - target.global_position).normalized() * SPEED
		elif dist > 200:
			velocity = (target.global_position - global_position).normalized() * SPEED
		else:
			velocity = Vector2.ZERO
		shoot_timer -= delta
		if shoot_timer <= 0.0:
			shoot_timer = shoot_interval
			_shoot_at_target()
	else:
		velocity = (target.global_position - global_position).normalized() * SPEED
	if contact_timer <= 0.0 and dist < CONTACT_RANGE:
		if target.has_method("take_damage"):
			target.take_damage(contact_damage)
			contact_timer = CONTACT_COOLDOWN
	move_and_slide()

func _shoot_at_target() -> void:
	if not target or not is_instance_valid(target):
		return
	var proj = Area2D.new()
	proj.set_script(load("res://enemy_bullet.gd"))
	proj.direction = (target.global_position - global_position).normalized()
	proj.position = global_position
	proj.color = body_color.lightened(0.3)
	get_parent().add_child(proj)

func take_damage(amount: float) -> void:
	if is_dead:
		return
	hp -= amount
	flash_timer = 0.12
	if hp <= 0:
		_die()

func _die() -> void:
	is_dead = true
	var drops: Array = []
	var count = randi_range(1, 2)
	if enemy_type == "tank":
		count = randi_range(2, 3)
	for i in count:
		if element_bias >= 0 and randf() < 0.6:
			drops.append(element_bias)
		else:
			drops.append(randi_range(0, 5))
	died.emit(global_position, drops, xp_reward)
	visible = false
	queue_free()
