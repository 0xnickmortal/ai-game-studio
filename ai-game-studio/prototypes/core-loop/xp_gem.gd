# PROTOTYPE - NOT FOR PRODUCTION
extends Node2D

var xp_value: int = 1
var time: float = 0.0
var magnet_speed: float = 0.0
var target: Node2D = null

func _ready() -> void:
	add_to_group("xp_gems")

func _process(delta: float) -> void:
	time += delta

	# Magnet toward player
	if target and is_instance_valid(target):
		var dist = global_position.distance_to(target.global_position)
		if dist < target.get("pickup_magnet_range"):
			magnet_speed = minf(magnet_speed + 600 * delta, 350)
			var dir = (target.global_position - global_position).normalized()
			position += dir * magnet_speed * delta
	queue_redraw()

func _draw() -> void:
	# Diamond shape
	var s = 4.0 + sin(time * 5.0) * 0.5
	var points = PackedVector2Array([
		Vector2(0, -s),
		Vector2(s * 0.7, 0),
		Vector2(0, s),
		Vector2(-s * 0.7, 0)
	])

	# Glow
	var glow_s = s * 2.0
	var glow_points = PackedVector2Array([
		Vector2(0, -glow_s),
		Vector2(glow_s * 0.7, 0),
		Vector2(0, glow_s),
		Vector2(-glow_s * 0.7, 0)
	])
	DrawUtil.poly(self, glow_points, Color(0.3, 0.5, 1.0, 0.15))
	DrawUtil.poly(self, points, Color(0.4, 0.6, 1.0))
	# Highlight
	var h_points = PackedVector2Array([
		Vector2(0, -s * 0.5),
		Vector2(s * 0.3, 0),
		Vector2(0, s * 0.3),
		Vector2(-s * 0.3, 0)
	])
	DrawUtil.poly(self, h_points, Color(0.7, 0.85, 1.0, 0.6))
