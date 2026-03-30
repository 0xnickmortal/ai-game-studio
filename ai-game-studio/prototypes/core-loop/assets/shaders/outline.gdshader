// Colored outline shader for sprites
shader_type canvas_item;

uniform vec4 outline_color : source_color = vec4(0.0, 0.0, 0.0, 0.8);
uniform float outline_width : hint_range(0.0, 5.0) = 1.5;

void fragment() {
	vec4 col = texture(TEXTURE, UV);
	if (col.a < 0.1) {
		// Check neighbors for outline
		float a = 0.0;
		vec2 size = TEXTURE_PIXEL_SIZE * outline_width;
		a += texture(TEXTURE, UV + vec2(-size.x, 0)).a;
		a += texture(TEXTURE, UV + vec2(size.x, 0)).a;
		a += texture(TEXTURE, UV + vec2(0, -size.y)).a;
		a += texture(TEXTURE, UV + vec2(0, size.y)).a;
		a += texture(TEXTURE, UV + vec2(-size.x, -size.y)).a * 0.7;
		a += texture(TEXTURE, UV + vec2(size.x, -size.y)).a * 0.7;
		a += texture(TEXTURE, UV + vec2(-size.x, size.y)).a * 0.7;
		a += texture(TEXTURE, UV + vec2(size.x, size.y)).a * 0.7;
		if (a > 0.0) {
			col = outline_color;
		}
	}
	COLOR = col;
}
