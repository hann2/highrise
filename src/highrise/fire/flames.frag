// Turns the heat buffer (see FireRenderer) into flames, drawn additively.
// Noise is in world space (meters), so the flames don't swim with the camera.

precision highp float;

in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uHeat;

// x, y, width, height of the heat buffer, in meters
uniform vec4 uRect;
uniform float uTime;
// How far the heat is pushed around, in meters
uniform float uWarp;
// The size of a pixel of the heat buffer, in texture coordinates
uniform vec2 uTexel;

// --- Noise ---

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// Value noise, 0 to 1
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

// Four octaves, 0 to about 1
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

// The noise at `p`, carried along `flow` (meters per second): two copies
// scrolling on staggered cycles and cross-faded, so it moves forever without
// stretching out
float flowingNoise(vec2 p, vec2 flow, float time, float speed) {
  float phaseA = fract(time * 0.5);
  float phaseB = fract(time * 0.5 + 0.5);
  float a = fbm(vec3(p - flow * phaseA * speed, time * 0.8));
  float b = fbm(vec3(p - flow * phaseB * speed + 13.3, time * 0.8));
  float mixB = abs(phaseA * 2.0 - 1.0);
  return mix(a, b, mixB);
}

void main(void) {
  vec2 world = uRect.xy + vUV * uRect.zw;

  // Push the heat around with slowly boiling noise
  vec2 warp = vec2(
    fbm(vec3(world * 1.1, uTime * 0.7)),
    fbm(vec3(world * 1.1 + 31.7, uTime * 0.7))
  ) - 0.5;
  vec2 uv = vUV + warp * 2.0 * uWarp / uRect.zw;
  float heat = texture(uHeat, uv).r;

  // Which way is out of the fire (down the slope of the heat), and how much
  // of an edge this is
  vec2 texel = 2.0 * uTexel;
  vec2 slope = vec2(
    texture(uHeat, uv + vec2(texel.x, 0.0)).r - texture(uHeat, uv - vec2(texel.x, 0.0)).r,
    texture(uHeat, uv + vec2(0.0, texel.y)).r - texture(uHeat, uv - vec2(0.0, texel.y)).r
  );
  vec2 outward = -slope / (length(slope) + 0.02);

  // Tongues: noise that pours outwards at the edges, and boils in the middle
  vec2 p = world * 2.4 + warp * 2.0;
  float detail = flowingNoise(p, outward, uTime * 1.3, 2.5);
  detail = smoothstep(0.2, 0.8, detail);
  float f = heat * (0.2 + 1.1 * detail);
  float body = smoothstep(0.3, 0.45, f);

  // Brighter where it's hottest and where the noise peaks
  float veins = fbm(vec3(world * 3.1 - warp * 1.5, uTime * 2.2 + 7.0));
  float brightness = f * (0.6 + 0.6 * veins);

  vec3 color = mix(vec3(0.5, 0.05, 0.01), vec3(0.95, 0.3, 0.03), smoothstep(0.25, 0.5, brightness));
  color = mix(color, vec3(1.0, 0.62, 0.12), smoothstep(0.5, 0.8, brightness));
  color = mix(color, vec3(1.0, 0.88, 0.55), smoothstep(0.85, 1.15, brightness));

  // A faint glow around the flames
  float glow = smoothstep(0.0, 0.5, heat) * 0.15 * (1.0 - body);
  vec3 rgb = color * body + vec3(1.0, 0.3, 0.04) * glow;

  finalColor = vec4(rgb, max(body, glow));
}
