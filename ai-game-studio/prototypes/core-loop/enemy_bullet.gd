# PROTOTYPE - NOT FOR PRODUCTION
extends Area2D

var direction: Vector2 = Vector2.RIGHT
var speed: float = 180.0
var damage: float = 8.0
var color: Color = Color(1, 0.3, 0.3)
var lifetime: float = 3.0
var time: float = 0.0

func _ready() -> void:
	var shape = CollisionShape2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 5.0
	shape.shape = circle
	add_child(shape)
	collision_layer = 0
	collision_mask = 1  # hits player

func _process(delta: float) -> void:
	time += delta
	queue_redraw()

func _draw() -> void:
	var pulse = 1.0 + sin(time * 8.0) * 0.2
	_draw_circ(Vector2.ZERO, 6 * pulse, Color(color.r, color.g, color.b, 0.2))
	_draw_circ(Vector2.ZERO, 4, color)
	_draw_circ(Vector2(-1, -1), 2, Color(1, 1, 1, 0.3))

func _draw_circ(center: Vector2, radius: float, col: Color) -> void:
	if radius < 0.5 or col.a < 0.01:
		return
	DrawUtil.circ(self, center, radius, col)

func _physics_process(delta: float) -> void:
	position += direction * speed * delta
	lifetime -= delta
	if lifetime <= 0:
		queue_free()
		return

	var bodies = get_overlapping_bodies()
	for body in bodies:
		if body.has_method("take_damage"):
			body.take_damage(damage)
			queue_free()
			return
