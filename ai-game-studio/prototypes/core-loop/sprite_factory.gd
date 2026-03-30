# PROTOTYPE - NOT FOR PRODUCTION
# Factory for creating sprites from SVGs with shader materials
class_name SpriteFactory

static var _svg_cache: Dictionary = {}

static func make_sprite(svg_path: String, scale_factor: float = 1.0) -> Sprite2D:
	var sprite = Sprite2D.new()
	var tex = _load_svg_texture(svg_path, scale_factor)
	if tex:
		sprite.texture = tex
	return sprite

static func make_sprite_with_outline(svg_path: String, outline_color: Color, scale_factor: float = 1.0) -> Sprite2D:
	var sprite = make_sprite(svg_path, scale_factor)
	var mat = ShaderMaterial.new()
	var shader = load("res://assets/shaders/outline.gdshader")
	if shader:
		mat.shader = shader
		mat.set_shader_parameter("outline_color", outline_color)
		mat.set_shader_parameter("outline_width", 1.5)
		sprite.material = mat
	return sprite

static func make_sprite_with_glow(svg_path: String, glow_color: Color, scale_factor: float = 1.0) -> Sprite2D:
	var sprite = make_sprite(svg_path, scale_factor)
	var mat = ShaderMaterial.new()
	var shader = load("res://assets/shaders/glow_pulse.gdshader")
	if shader:
		mat.shader = shader
		mat.set_shader_parameter("glow_color", glow_color)
		mat.set_shader_parameter("glow_intensity", 1.2)
		mat.set_shader_parameter("pulse_speed", 3.0)
		sprite.material = mat
	return sprite

static func make_shadow(svg_path: String, scale_factor: float = 1.0) -> Sprite2D:
	var sprite = make_sprite(svg_path, scale_factor)
	sprite.modulate = Color(1, 1, 1, 0.3)
	sprite.scale = Vector2(1.0, 0.3)
	sprite.position = Vector2(0, 12)
	var mat = ShaderMaterial.new()
	var shader = load("res://assets/shaders/shadow.gdshader")
	if shader:
		mat.shader = shader
		mat.set_shader_parameter("shadow_alpha", 0.3)
		sprite.material = mat
	return sprite

static func apply_hit_flash(sprite: Sprite2D, amount: float) -> void:
	if not sprite.material or not sprite.material is ShaderMaterial:
		var mat = ShaderMaterial.new()
		var shader = load("res://assets/shaders/hit_flash.gdshader")
		if shader:
			mat.shader = shader
			sprite.material = mat
	if sprite.material and sprite.material is ShaderMaterial:
		sprite.material.set_shader_parameter("flash_amount", amount)

static func _load_svg_texture(path: String, scale_factor: float) -> ImageTexture:
	var cache_key = path + str(scale_factor)
	if _svg_cache.has(cache_key):
		return _svg_cache[cache_key]

	var file = FileAccess.open(path, FileAccess.READ)
	if not file:
		return null
	var svg_string = file.get_as_text()
	file.close()

	var image = Image.new()
	var err = image.load_svg_from_string(svg_string, scale_factor)
	if err != OK:
		return null

	var tex = ImageTexture.create_from_image(image)
	_svg_cache[cache_key] = tex
	return tex
