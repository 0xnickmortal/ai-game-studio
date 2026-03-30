// Chromatic aberration + vignette post-process (apply to a ColorRect covering screen)
shader_type canvas_item;

uniform float aberration : hint_range(0.0, 5.0) = 1.0;
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.3;
uniform float vignette_radius : hint_range(0.0, 2.0) = 0.8;

void fragment() {
	vec2 center = vec2(0.5, 0.5);
	vec2 offset = (UV - center) * aberration * 0.002;

	float r = texture(TEXTURE, UV + offset).r;
	float g = texture(TEXTURE, UV).g;
	float b = texture(TEXTURE, UV - offset).b;
	float a = texture(TEXTURE, UV).a;

	vec4 col = vec4(r, g, b, a);

	// Vignette
	float dist = distance(UV, center);
	float vignette = smoothstep(vignette_radius, vignette_radius - 0.3, dist);
	col.rgb *= mix(1.0 - vignette_strength, 1.0, vignette);

	COLOR = col;
}
