// A muzzle flash (see MuzzleFlash): lobes of heat added up, torn by noise
// that streams out from the muzzle, eaten away as it cools, and colored by
// how hot each point is, drawn additively. In meters, in the flash's frame:
// the muzzle at the origin, x forward.

precision highp float;

#define MAX_LOBES 8

in vec2 vLocal;
out vec4 finalColor;

// Each lobe: x, y of its origin, then the direction it points
uniform vec4 uLobeA[MAX_LOBES];
// Each lobe: length, half width at its widest, heat
uniform vec4 uLobeB[MAX_LOBES];
uniform float uLobeCount;
// How far through its life it is, 0 to 1
uniform float uAge;
// Seconds since it went off
uniform float uTime;
uniform float uSeed;
uniform float uTurbulence;
uniform float uTemperature;

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

// Three octaves, 0 to about 1
float fbm(vec3 p) {
  float sum = 0.5 * noise(p);
  sum += 0.25 * noise(p * 2.03 + vec3(1.7, -3.1, 0.0));
  sum += 0.125 * noise(p * 4.01 + vec3(-2.3, 5.2, 0.0));
  return sum / 0.875;
}

// --- Shape ---

// The heat of one lobe at `p`: round at its origin, swelling, then tapering
// to a point at its tip, hottest near the origin
float lobeHeat(vec2 p, vec4 a, vec4 b, float grow) {
  vec2 d = p - a.xy;
  float u = dot(d, a.zw);
  float v = a.z * d.y - a.w * d.x;
  float len = b.x * grow;
  float w = b.y * mix(0.6, 1.0, grow);
  float base = w * 0.45;
  if (u < 0.0) {
    float q = length(vec2(u, v)) / base;
    return b.z * max(0.0, 1.0 - q * q);
  }
  float t = u / len;
  if (t >= 1.0) {
    return 0.0;
  }
  float halfWidth =
    w * mix(0.45, 1.0, smoothstep(0.0, 0.35, t)) * pow(1.0 - t, 0.55);
  float lateral = v / max(halfWidth, 1e-4);
  return b.z * max(0.0, 1.0 - lateral * lateral) * pow(1.0 - t, 0.6);
}

// Dark red, orange, yellow, white
vec3 ramp(float x) {
  vec3 color = mix(
    vec3(0.55, 0.07, 0.01),
    vec3(1.0, 0.42, 0.06),
    smoothstep(0.05, 0.4, x)
  );
  color = mix(color, vec3(1.0, 0.8, 0.35), smoothstep(0.4, 0.9, x));
  return mix(color, vec3(1.0, 0.97, 0.88), smoothstep(1.0, 1.7, x));
}

void main(void) {
  vec2 p = vLocal;
  float r = length(p);
  float theta = atan(p.y, p.x);
  vec3 seed = vec3(uSeed * 17.0, uSeed * 31.0, uSeed * 7.0);

  // Noise in rings and spokes around the muzzle, streaming outward, so it
  // tears into streaks that point away from the muzzle
  float outward = r * 7.0 - uTime * 50.0;
  vec2 warp = vec2(
    fbm(vec3(outward, theta * 4.0, 0.0) + seed),
    fbm(vec3(outward, theta * 4.0, 3.7) + seed)
  ) - 0.5;
  // Torn more toward the tips than at the muzzle
  p += warp * uTurbulence * (0.02 + 0.45 * r);

  // Shoots out fast, then keeps drifting a little
  float grow = mix(0.75, 1.0, smoothstep(0.0, 0.3, uAge)) + 0.2 * uAge;
  float heat = 0.0;
  for (int i = 0; i < MAX_LOBES; i++) {
    if (float(i) >= uLobeCount) {
      break;
    }
    heat += lobeHeat(p, uLobeA[i], uLobeB[i], grow);
  }

  // Streaks: spokes of hotter and cooler
  float streaks = fbm(vec3(r * 3.0 - uTime * 30.0, theta * 12.0, 9.1) + seed);
  heat *= mix(1.0, 0.35 + 1.3 * streaks, 0.4 + 0.4 * uTurbulence);

  // Cooling: eaten away where the noise is low, so it breaks into tongues
  // rather than shrinking, and dimmer and redder, rather than smaller
  float erode = fbm(vec3(p * 9.0, uTime * 20.0) + seed + 4.4);
  float shape =
    heat - uAge * uAge * (0.25 + 0.6 * uTurbulence) * (1.3 - erode);
  float x = shape * uTemperature * (1.0 - 0.8 * uAge);
  float brightness =
    smoothstep(0.02, 0.2, shape) *
    (0.45 + 0.55 * min(x, 1.6)) *
    pow(1.0 - uAge, 1.1);
  if (brightness <= 0.0) {
    discard;
  }
  finalColor = vec4(ramp(x) * brightness, min(brightness, 1.0));
}
