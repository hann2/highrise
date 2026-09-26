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
// Light, wispy smoke, and dark, sooty smoke
uniform vec3 uSmokeColor;
uniform vec3 uDarkColor;
// Smoke this dense leans dark
uniform float uDarkDensity;
// How thick the smoke gets at most (its alpha)
uniform float uAlpha;
// The density a texture value of 1 stands for
uniform float uMaxDensity;
// How far the density is pushed around, in meters
uniform float uWarp;
// The size of a cell of the density texture, in texture coordinates
uniform vec2 uTexel;
// Meters per second the look flows away from where the smoke is thickest
uniform float uFlowSpeed;

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

// The noise at `p`, carried along `flow` (how far it moves in one cycle, in
// noise units): three copies, each sliding for one cycle and then jumping
// back, on staggered cycles and cross-faded so none is ever seen jumping.
// Keep `flow` small next to the size of the noise's features (a fifth or so),
// or the cross-fades show as the smoke flicking back the other way.
float flowingNoise(vec3 p, vec2 flow, float time) {
  float total = 0.0;
  float weights = 0.0;
  for (int i = 0; i < 3; i++) {
    float phase = fract(time + float(i) / 3.0);
    // Fully in halfway through its slide, fully out as it jumps
    float weight = 1.0 - abs(phase * 2.0 - 1.0);
    total += weight * fbm(vec3(p.xy - flow * phase + float(i) * 13.3, p.z));
    weights += weight;
  }
  return total / weights;
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

  // Which way is away from the thick smoke, and how steeply it thins: the
  // look pours that way, faster where it thins faster
  vec2 slope = vec2(
    texture(uDensity, uv + vec2(uTexel.x, 0.0)).r - texture(uDensity, uv - vec2(uTexel.x, 0.0)).r,
    texture(uDensity, uv + vec2(0.0, uTexel.y)).r - texture(uDensity, uv - vec2(0.0, uTexel.y)).r
  ) * uMaxDensity;
  vec2 outward = -slope / (length(slope) + 0.15);
  // Short cycles, so each copy of the noise only slides a little way before
  // it's swapped for another
  float cycle = 0.4;
  vec2 flow = outward * uFlowSpeed * cycle;

  // Billows: thicker and thinner patches that drift and change
  float billows = flowingNoise(
    vec3(world * 0.7 + warp * 1.5, uTime * 0.2),
    flow * 0.7,
    uTime / cycle
  );
  billows = smoothstep(0.25, 0.75, billows);
  float thickness = 1.0 - exp(-density * (0.15 + 1.4 * billows));
  // Tunnels bullets left, where they went: not pushed around like the rest,
  // so they stay sharp
  float hidden = texture(uDensity, vUV).g;
  float alpha = thickness * uAlpha * (1.0 - hidden);

  // Light and dark: big, slow patches of soot drifting through (a second,
  // larger noise), and the thickest smoke, near the fire, darker still
  float soot = flowingNoise(
    vec3(world * 0.28 - warp * 0.8 + 41.0, uTime * 0.09),
    flow * 0.28,
    uTime / cycle + 0.25
  );
  soot = smoothstep(0.35, 0.65, soot);
  float dark = clamp(soot * 0.75 + density / uDarkDensity * 0.45, 0.0, 1.0);
  vec3 color = mix(uSmokeColor, uDarkColor, dark);

  finalColor = vec4(color * alpha, alpha);
}
