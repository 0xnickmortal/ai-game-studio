// Drop shadow effect — renders sprite as flat dark ellipse
shader_type canvas_item;

uniform float shadow_alpha : hint_range(0.0, 1.0) = 0.3;

void fragment() {
	vec4 col = texture(TEXTURE, UV);
	if (col.a > 0.1) {
		COLOR = vec4(0.0, 0.0, 0.0, col.a * shadow_alpha);
	} else {
		COLOR = vec4(0.0, 0.0, 0.0, 0.0);
	}
}
