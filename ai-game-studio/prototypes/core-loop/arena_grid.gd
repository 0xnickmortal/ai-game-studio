# PROTOTYPE - NOT FOR PRODUCTION
extends Node2D

var time: float = 0.0

func _process(delta: float) -> void:
	time += delta
	# Only redraw occasionally for ambient light change
	if int(time * 2) != int((time - delta) * 2):
		queue_redraw()

func _ready() -> void:
	queue_redraw()

func _draw() -> void:
	var arena = Vector2(960, 540)

	# Tiled floor pattern (checkerboard with subtle variation)
	var tile = 40
	var x = 0
	while x < arena.x:
		var y = 0
		while y < arena.y:
			var checker = ((x / tile) + (y / tile)) as int % 2
			var base = Color(0.1, 0.1, 0.14) if checker == 0 else Color(0.09, 0.09, 0.12)
			draw_rect(Rect2(x, y, tile, tile), base)
			# Subtle tile edge (top and left)
			draw_line(Vector2(x, y), Vector2(x + tile, y), Color(0.14, 0.14, 0.18, 0.3), 1)
			draw_line(Vector2(x, y), Vector2(x, y + tile), Color(0.14, 0.14, 0.18, 0.3), 1)
			y += tile
		x += tile

	# Vignette corners (darken edges)
	var vign = Color(0.02, 0.02, 0.05, 0.4)
	# Top-left corner gradient
	for i in 5:
		var s = 80 - i * 15
		var a = 0.3 - i * 0.06
		draw_rect(Rect2(0, 0, s, s), Color(vign.r, vign.g, vign.b, a))
	# Top-right
	for i in 5:
		var s = 80 - i * 15
		var a = 0.3 - i * 0.06
		draw_rect(Rect2(arena.x - s, 0, s, s), Color(vign.r, vign.g, vign.b, a))
	# Bottom-left
	for i in 5:
		var s = 80 - i * 15
		var a = 0.3 - i * 0.06
		draw_rect(Rect2(0, arena.y - s, s, s), Color(vign.r, vign.g, vign.b, a))
	# Bottom-right
	for i in 5:
		var s = 80 - i * 15
		var a = 0.3 - i * 0.06
		draw_rect(Rect2(arena.x - s, arena.y - s, s, s), Color(vign.r, vign.g, vign.b, a))

	# Wall decorations (torches/sconces)
	_draw_torch(Vector2(80, 15))
	_draw_torch(Vector2(280, 15))
	_draw_torch(Vector2(480, 15))
	_draw_torch(Vector2(680, 15))
	_draw_torch(Vector2(880, 15))

	# Floor stains (random positioned but deterministic)
	_draw_stain(Vector2(150, 200), 15, Color(0.12, 0.08, 0.06, 0.15))
	_draw_stain(Vector2(500, 400), 20, Color(0.08, 0.12, 0.06, 0.12))
	_draw_stain(Vector2(750, 150), 12, Color(0.12, 0.06, 0.08, 0.1))
	_draw_stain(Vector2(350, 350), 18, Color(0.06, 0.08, 0.12, 0.1))

func _draw_torch(pos: Vector2) -> void:
	# Bracket
	draw_rect(Rect2(pos.x - 2, pos.y, 4, 8), Color(0.35, 0.3, 0.25))
	# Flame (animated via time)
	var flicker = sin(time * 8 + pos.x) * 2
	var flame_col = Color(1, 0.6, 0.15, 0.7 + sin(time * 6 + pos.x * 0.1) * 0.2)
	_draw_circ(Vector2(pos.x, pos.y - 2 + flicker * 0.3), 4, flame_col)
	_draw_circ(Vector2(pos.x, pos.y - 4 + flicker * 0.5), 2.5, Color(1, 0.9, 0.4, 0.8))
	# Light pool on floor
	_draw_circ(Vector2(pos.x, pos.y + 20), 30, Color(1, 0.7, 0.3, 0.03 + sin(time * 5 + pos.x) * 0.01))

func _draw_stain(pos: Vector2, radius: float, col: Color) -> void:
	_draw_circ(pos, radius, col)
	_draw_circ(pos + Vector2(radius * 0.3, radius * 0.2), radius * 0.6, Color(col.r, col.g, col.b, col.a * 0.7))

func _draw_circ(center: Vector2, radius: float, color: Color) -> void:
	if radius < 0.5 or color.a < 0.01:
		return
	DrawUtil.circ(self, center, radius, color)
