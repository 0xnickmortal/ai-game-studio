# PROTOTYPE - NOT FOR PRODUCTION
extends Node2D

var element: int = 0
var time: float = 0.0
var spawn_y: float = 0.0

var use_svg: bool = false

func _ready() -> void:
	add_to_group("ingredients")
	spawn_y = position.y

	var orb_paths = {
		0: "res://assets/svg/orb_fire.svg",
		1: "res://assets/svg/orb_ice.svg",
		2: "res://assets/svg/orb_thunder.svg",
		3: "res://assets/svg/orb_poison.svg",
		4: "res://assets/svg/orb_heal.svg",
		5: "res://assets/svg/orb_earth.svg",
	}
	var svg_path = orb_paths.get(element, "")
	if svg_path != "":
		var color: Color = GameData.ELEMENT_COLORS.get(element, Color.GRAY)
		var spr = SpriteFactory.make_sprite_with_glow(svg_path, color, 2.0)
		if spr and spr.texture:
			spr.name = "SVGSprite"
			add_child(spr)
			use_svg = true

func _process(delta: float) -> void:
	time += delta
	position.y = spawn_y + sin(time * 3.0) * 3.0
	queue_redraw()

func _draw() -> void:
	if use_svg:
		return
	var color: Color = GameData.ELEMENT_COLORS.get(element, Color.GRAY)
	var pulse = 0.85 + sin(time * 4.0) * 0.15

	# Ground glow
	_draw_ellipse(Vector2(0, 10), Vector2(8, 3), Color(color.r, color.g, color.b, 0.1))

	# Outer glow ring
	_draw_circ(Vector2.ZERO, 12 * pulse, Color(color.r, color.g, color.b, 0.12))

	# Main orb with shading
	_draw_circ(Vector2.ZERO, 8, color.darkened(0.15))
	_draw_circ(Vector2(0, -1), 7, color)

	# Specular highlight
	_draw_circ(Vector2(-2, -3), 3, color.lightened(0.4))
	_draw_circ(Vector2(-1.5, -2.5), 1.5, Color(1, 1, 1, 0.5))

	# Element icon (better symbols)
	match element:
		0:  # Fire
			_draw_flame(Vector2(0, -1))
		1:  # Ice
			_draw_crystal(Vector2(0, 0))
		2:  # Thunder
			_draw_bolt(Vector2(0, 0))
		3:  # Poison
			_draw_skull(Vector2(0, 0))
		4:  # Heal
			_draw_cross(Vector2(0, 0))
		5:  # Earth
			_draw_leaf(Vector2(0, 0))

func _draw_flame(c: Vector2) -> void:
	var pts = PackedVector2Array([
		c + Vector2(0, -5), c + Vector2(3, 0), c + Vector2(1, 2),
		c + Vector2(2, 4), c + Vector2(0, 3), c + Vector2(-2, 4),
		c + Vector2(-1, 2), c + Vector2(-3, 0),
	])
	draw_colored_polygon(pts, Color(1, 0.8, 0.3, 0.7))

func _draw_crystal(c: Vector2) -> void:
	var pts = PackedVector2Array([
		c + Vector2(0, -5), c + Vector2(3, -1), c + Vector2(2, 4),
		c + Vector2(-2, 4), c + Vector2(-3, -1),
	])
	draw_colored_polygon(pts, Color(0.7, 0.9, 1.0, 0.6))

func _draw_bolt(c: Vector2) -> void:
	var pts = PackedVector2Array([
		c + Vector2(-1, -5), c + Vector2(3, -5), c + Vector2(0, -1),
		c + Vector2(3, -1), c + Vector2(-1, 5), c + Vector2(1, 0),
		c + Vector2(-2, 0),
	])
	draw_colored_polygon(pts, Color(1, 1, 0.5, 0.7))

func _draw_skull(c: Vector2) -> void:
	_draw_circ(c + Vector2(0, -1), 3.5, Color(0.8, 0.7, 0.9, 0.6))
	_draw_circ(c + Vector2(-1.5, -1.5), 1, Color(0.2, 0, 0.3, 0.8))
	_draw_circ(c + Vector2(1.5, -1.5), 1, Color(0.2, 0, 0.3, 0.8))

func _draw_cross(c: Vector2) -> void:
	draw_rect(Rect2(c.x - 1, c.y - 4, 2, 8), Color(1, 1, 1, 0.6))
	draw_rect(Rect2(c.x - 4, c.y - 1, 8, 2), Color(1, 1, 1, 0.6))

func _draw_leaf(c: Vector2) -> void:
	var pts = PackedVector2Array([
		c + Vector2(0, -4), c + Vector2(3, -1), c + Vector2(2, 3),
		c + Vector2(0, 4), c + Vector2(-2, 3), c + Vector2(-3, -1),
	])
	draw_colored_polygon(pts, Color(0.4, 0.9, 0.3, 0.6))
	draw_line(c + Vector2(0, -3), c + Vector2(0, 3), Color(0.3, 0.7, 0.2, 0.5), 1)

func _draw_circ(center: Vector2, radius: float, color: Color) -> void:
	if radius < 0.5 or color.a < 0.01:
		return
	DrawUtil.circ(self, center, radius, color)

func _draw_ellipse(center: Vector2, size: Vector2, color: Color) -> void:
	if size.x < 0.5 or size.y < 0.5 or color.a < 0.01:
		return
	DrawUtil.ellipse(self, center, size, color)
