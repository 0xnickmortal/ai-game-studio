# PROTOTYPE - NOT FOR PRODUCTION
# Shared drawing utilities with safety guards
class_name DrawUtil

static func circ(node: CanvasItem, center: Vector2, radius: float, color: Color) -> void:
	if radius < 0.5 or color.a < 0.01:
		return
	var pts = PackedVector2Array()
	var segments = 12 if radius < 4 else 16
	for i in segments:
		var a = i * TAU / segments
		pts.append(center + Vector2(cos(a), sin(a)) * radius)
	node.draw_colored_polygon(pts, color)

static func ellipse(node: CanvasItem, center: Vector2, size: Vector2, color: Color) -> void:
	if size.x < 0.5 or size.y < 0.5 or color.a < 0.01:
		return
	var pts = PackedVector2Array()
	var segments = 16
	for i in segments:
		var a = i * TAU / segments
		pts.append(center + Vector2(cos(a) * size.x, sin(a) * size.y))
	node.draw_colored_polygon(pts, color)

static func poly(node: CanvasItem, points: PackedVector2Array, color: Color) -> void:
	if points.size() < 3 or color.a < 0.01:
		return
	node.draw_colored_polygon(points, color)
