// Draws the smoke field (see SmokeField): the density texture, pushed around
// and thickened and thinned by slow noise so the cells don't show. Noise is in
// world space (meters), so the smoke doesn't swim with the camera.

precision highp float;

in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uDensity;

// x, y, width, height of the density texture, in meters
uniform vec4 uRect;
uniform float uTime;
uniform vec3 uSmokeColor;
// How thick the smoke gets at most (its alpha)
uniform float uAlpha;
// The density a texture value of 1 stands for
uniform float uMaxDensity;
// How far the density is pushed around, in meters
uniform float uWarp;

// --- Noise (the same as flames.frag) ---

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
      mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x),
      f.y
    ),
    mix(
      mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
      mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x),
      f.y
    ),
    f.z
  );
}

float fbm(vec3 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amplitude * noise(p);
    p = p * 2.03 + vec3(1.7, -3.1, 0.0);
    amplitude *= 0.5;
  }
  return sum / 0.9375;
}

void main(void) {
  vec2 world = uRect.xy + vUV * uRect.zw;

  // Slowly rolling, so the smoke seems to churn
  vec2 warp = vec2(
    fbm(vec3(world * 0.45, uTime * 0.12)),
    fbm(vec3(world * 0.45 + 19.3, uTime * 0.12))
  ) - 0.5;
  vec2 uv = vUV + warp * 2.0 * uWarp / uRect.zw;
  float density = texture(uDensity, uv).r * uMaxDensity;

  // Billows: thicker and thinner patches that drift and change
  float billows = fbm(vec3(world * 0.7 + warp * 1.5, uTime * 0.2));
  billows = smoothstep(0.25, 0.75, billows);
  float thickness = 1.0 - exp(-density * (0.15 + 1.4 * billows));
  float alpha = thickness * uAlpha;

  finalColor = vec4(uSmokeColor * alpha, alpha);
}
