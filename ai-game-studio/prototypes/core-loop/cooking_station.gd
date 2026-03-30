# PROTOTYPE - NOT FOR PRODUCTION
extends Node2D

var time: float = 0.0
var use_svg: bool = false

func _ready() -> void:
	add_to_group("stations")

	var spr = SpriteFactory.make_sprite("res://assets/svg/cauldron.svg", 2.0)
	if spr and spr.texture:
		spr.name = "SVGSprite"
		spr.offset = Vector2(0, -4)
		add_child(spr)
		use_svg = true

func _process(delta: float) -> void:
	time += delta
	queue_redraw()

func _draw() -> void:
	# Animated effects (drawn on top of SVG or standalone)
	# Ground glow
	_draw_circ(Vector2(0, 20), 35, Color(1, 0.6, 0.2, 0.04))
	_draw_circ(Vector2(0, 18), 25, Color(1, 0.7, 0.3, 0.06))

	# Shadow
	_draw_ellipse(Vector2(0, 20), Vector2(22, 5), Color(0, 0, 0, 0.3))

	# Fire underneath
	for i in 3:
		var fx = sin(time * 4 + i * 2.1) * 6
		var fy = 14 + sin(time * 6 + i * 1.3) * 2
		var fs = 3 + sin(time * 8 + i) * 1
		_draw_circ(Vector2(fx, fy), fs, Color(1, 0.4, 0.1, 0.6))
		_draw_circ(Vector2(fx, fy - 2), fs * 0.6, Color(1, 0.7, 0.2, 0.5))

	# Cauldron legs
	var leg_col = Color(0.2, 0.18, 0.22)
	draw_line(Vector2(-16, 8), Vector2(-20, 18), leg_col, 3)
	draw_line(Vector2(16, 8), Vector2(20, 18), leg_col, 3)
	draw_line(Vector2(0, 10), Vector2(0, 18), leg_col, 2)

	# Cauldron body
	var iron = Color(0.22, 0.2, 0.25)
	var iron_light = Color(0.32, 0.28, 0.33)
	# Main pot shape
	var pot = PackedVector2Array([
		Vector2(-20, -8),
		Vector2(-22, 0),
		Vector2(-20, 10),
		Vector2(-14, 14),
		Vector2(14, 14),
		Vector2(20, 10),
		Vector2(22, 0),
		Vector2(20, -8),
	])
	draw_colored_polygon(pot, iron)
	# Rim
	_draw_ellipse(Vector2(0, -8), Vector2(22, 5), iron_light)
	_draw_ellipse(Vector2(0, -8), Vector2(19, 3.5), Color(0.15, 0.12, 0.18))

	# Handles
	draw_line(Vector2(-22, -4), Vector2(-26, -8), iron_light, 2.5)
	draw_line(Vector2(-26, -8), Vector2(-24, -12), iron_light, 2.5)
	draw_line(Vector2(22, -4), Vector2(26, -8), iron_light, 2.5)
	draw_line(Vector2(26, -8), Vector2(24, -12), iron_light, 2.5)

	# Liquid surface
	var liq_col = Color(0.25, 0.7, 0.25, 0.8)
	_draw_ellipse(Vector2(0, -6), Vector2(17, 3), liq_col)
	# Liquid shimmer
	_draw_ellipse(Vector2(-4, -7), Vector2(5, 1.5), Color(0.4, 0.9, 0.4, 0.4))

	# Bubbles
	for i in 4:
		var bx = sin(time * 2.3 + i * 1.7) * 10
		var by = -8 - abs(sin(time * 3 + i * 1.3)) * 5
		var br = 1.5 + sin(time * 5 + i * 2) * 0.5
		_draw_circ(Vector2(bx, by), br, Color(0.5, 1, 0.5, 0.4))
		_draw_circ(Vector2(bx - 0.5, by - 0.5), br * 0.4, Color(1, 1, 1, 0.3))

	# Steam
	for i in 3:
		var sx = sin(time * 1.2 + i * 2.1) * 12
		var progress = fmod(time * 0.8 + i * 0.33, 1.0)
		var sy = -12 - progress * 25
		var alpha = (1.0 - progress) * 0.2
		var sr = 3 + progress * 4
		if alpha > 0.01:
			_draw_circ(Vector2(sx, sy), sr, Color(0.8, 0.8, 0.85, alpha))

	# Label
	draw_string(ThemeDB.fallback_font, Vector2(-18, 34), "COOK [E]", 0, -1, 11, Color(0.9, 0.8, 0.3))

func _draw_circ(center: Vector2, radius: float, color: Color) -> void:
	if radius < 0.5 or color.a < 0.01:
		return
	DrawUtil.circ(self, center, radius, color)

func _draw_ellipse(center: Vector2, size: Vector2, color: Color) -> void:
	if size.x < 0.5 or size.y < 0.5 or color.a < 0.01:
		return
	DrawUtil.ellipse(self, center, size, color)
