# PROTOTYPE - NOT FOR PRODUCTION
extends Node2D

var amount: float = 0.0
var color: Color = Color.WHITE
var velocity: Vector2 = Vector2(0, -40)
var lifetime: float = 0.7
var font_size: int = 12
var is_crit: bool = false

func _ready() -> void:
	velocity.x = randf_range(-20, 20)
	if is_crit:
		font_size = 16

func _process(delta: float) -> void:
	position += velocity * delta
	velocity.y += 60 * delta
	lifetime -= delta
	if lifetime < 0.3:
		modulate.a = lifetime / 0.3
	if lifetime <= 0:
		queue_free()
		return
	queue_redraw()

func _draw() -> void:
	var text = str(int(amount))
	if is_crit:
		text = text + "!"
	draw_string(ThemeDB.fallback_font, Vector2(-8, 0), text, 0, -1, font_size, color)
