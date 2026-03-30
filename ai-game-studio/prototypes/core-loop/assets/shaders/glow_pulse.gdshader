// Pulsing glow effect for ingredients and projectiles
shader_type canvas_item;

uniform vec4 glow_color : source_color = vec4(1.0, 0.8, 0.2, 0.5);
uniform float glow_intensity : hint_range(0.0, 3.0) = 1.0;
uniform float pulse_speed : hint_range(0.0, 10.0) = 3.0;
uniform float glow_radius : hint_range(0.0, 10.0) = 3.0;

void fragment() {
	vec4 col = texture(TEXTURE, UV);
	float pulse = 0.7 + sin(TIME * pulse_speed) * 0.3;

	// Add glow around opaque pixels
	if (col.a > 0.1) {
		vec3 glow = glow_color.rgb * glow_intensity * pulse;
		col.rgb += glow * 0.3;
	} else {
		// Check nearby for glow bleed
		float a = 0.0;
		vec2 size = TEXTURE_PIXEL_SIZE * glow_radius;
		for (float x = -1.0; x <= 1.0; x += 0.5) {
			for (float y = -1.0; y <= 1.0; y += 0.5) {
				a += texture(TEXTURE, UV + vec2(x, y) * size).a;
			}
		}
		if (a > 0.0) {
			float glow_a = min(a * 0.08 * glow_intensity * pulse, 0.6);
			col = vec4(glow_color.rgb, glow_a);
		}
	}
	COLOR = col;
}
