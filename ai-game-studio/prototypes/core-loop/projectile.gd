# PROTOTYPE - NOT FOR PRODUCTION
extends Area2D

var direction: Vector2 = Vector2.RIGHT
var speed: float = 400.0
var damage: float = 20.0
var effect: String = "none"
var dish_color: Color = Color.WHITE
var lifetime: float = 2.0
var hit: bool = false
var is_basic: bool = false
var trail: Array = []
var time: float = 0.0

func _ready() -> void:
	var shape = CollisionShape2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 8.0
	shape.shape = circle
	add_child(shape)
	collision_layer = 8
	collision_mask = 2

func _process(delta: float) -> void:
	time += delta
	trail.append({"pos": global_position, "alpha": 1.0})
	var new_trail: Array = []
	for t in trail:
		t.alpha -= delta * (6.0 if is_basic else 3.5)
		if t.alpha > 0.0:
			new_trail.append(t)
	trail = new_trail
	queue_redraw()

func _draw() -> void:
	# Trail
	var prev_pos = Vector2.ZERO
	for i in trail.size():
		var t = trail[i]
		var local = t.pos - global_position
		var r = t.alpha * (3.0 if is_basic else 6.0)
		var c = Color(dish_color.r, dish_color.g, dish_color.b, t.alpha * 0.35)
		_draw_circ(local, r, c)

	if is_basic:
		# Basic: clean white pellet with glow
		_draw_circ(Vector2.ZERO, 5, Color(dish_color.r, dish_color.g, dish_color.b, 0.2))
		_draw_circ(Vector2.ZERO, 3.5, dish_color)
		_draw_circ(Vector2(-0.5, -0.5), 1.5, Color(1, 1, 1, 0.6))
	else:
		# Dish: animated, glowing, spinning
		var pulse = 1.0 + sin(time * 12.0) * 0.12
		var spin = time * 4.0
		# Outer glow
		_draw_circ(Vector2.ZERO, 12 * pulse, Color(dish_color.r, dish_color.g, dish_color.b, 0.15))
		# Main orb
		_draw_circ(Vector2.ZERO, 7, dish_color)
		# Inner pattern (rotating dots)
		for i in 3:
			var a = spin + i * TAU / 3
			var p = Vector2(cos(a), sin(a)) * 4
			_draw_circ(p, 2, dish_color.lightened(0.35))
		# Core highlight
		_draw_circ(Vector2(-1, -1), 2.5, Color(1, 1, 1, 0.4))

		# Effect indicator
		match effect:
			"burn":
				# Flame wisps
				for i in 2:
					var fy = -8 - sin(time * 10 + i * 2) * 3
					_draw_circ(Vector2(i * 4 - 2, fy), 2, Color(1, 0.5, 0.1, 0.5))
			"slow":
				# Ice crystals
				for i in 3:
					var a = time * 3 + i * TAU / 3
					var p = Vector2(cos(a), sin(a)) * 9
					draw_line(Vector2.ZERO, p, Color(0.5, 0.8, 1, 0.3), 1)
			"knockback":
				# Impact lines
				for i in 4:
					var a = direction.angle() + (i - 1.5) * 0.3
					var p = Vector2(cos(a), sin(a)) * 12
					draw_line(p * 0.5, p, Color(1, 1, 0.5, 0.4), 1)

func _draw_circ(center: Vector2, radius: float, color: Color) -> void:
	if radius < 0.5 or color.a < 0.01:
		return
	DrawUtil.circ(self, center, radius, color)

func _physics_process(delta: float) -> void:
	if hit:
		return
	position += direction * speed * delta
	lifetime -= delta
	if lifetime <= 0:
		queue_free()
		return
	var bodies = get_overlapping_bodies()
	for body in bodies:
		if body.has_method("take_damage"):
			hit = true
			body.take_damage(damage)
			_apply_effect(body)
			visible = false
			queue_free()
			return

func _apply_effect(target: Node2D) -> void:
	match effect:
		"burn":
			if target.has_method("take_damage"):
				var tw = target.create_tween()
				tw.tween_callback(target.take_damage.bind(5.0)).set_delay(0.5)
				tw.tween_callback(target.take_damage.bind(5.0)).set_delay(0.5)
		"slow":
			if "SPEED" in target:
				var orig: float = target.SPEED
				target.SPEED = orig * 0.4
				get_tree().create_timer(2.0).timeout.connect(_restore_speed.bind(target, orig))
		"knockback":
			target.position += direction.normalized() * 80
		_:
			pass

func _restore_speed(target: Node2D, orig: float) -> void:
	if is_instance_valid(target):
		target.SPEED = orig
