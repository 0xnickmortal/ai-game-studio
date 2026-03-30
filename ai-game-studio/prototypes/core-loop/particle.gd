# PROTOTYPE - NOT FOR PRODUCTION
extends Node2D

var color: Color = Color.WHITE
var dir: Vector2 = Vector2.UP
var spd: float = 100.0
var lifetime: float = 0.6
var max_lifetime: float = 0.6
var size: float = 4.0
var start_size: float = 4.0
var gravity: float = 0.0
var fade_type: int = 0  # 0=normal, 1=spark, 2=smoke

func _ready() -> void:
	start_size = size
	max_lifetime = lifetime

func _process(delta: float) -> void:
	position += dir * spd * delta
	dir.y += gravity * delta
	spd *= 0.96
	lifetime -= delta
	var t = 1.0 - (lifetime / max_lifetime)

	match fade_type:
		1:  # Spark: shrink fast, stay bright
			size = start_size * (1.0 - t * t)
		2:  # Smoke: grow and fade
			size = start_size * (1.0 + t * 2)
			color.a = (1.0 - t) * 0.3
		_:  # Normal
			size = start_size * (1.0 - t)
			color.a = 1.0 - t

	if lifetime <= 0:
		queue_free()
		return
	queue_redraw()

func _draw() -> void:
	if size < 0.5:
		return
	var pts = PackedVector2Array()
	var segments = 8 if fade_type != 1 else 4  # Sparks are diamond-shaped
	for i in segments:
		var a = i * TAU / segments
		pts.append(Vector2(cos(a), sin(a)) * size)
	if pts.size() >= 3:
		draw_colored_polygon(pts, color)
