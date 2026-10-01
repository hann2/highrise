// Shadows from the level's walls, for one light (see ShadowCasters and
// Shadows). Every wall edge is a quad: its two corners (0 and 1), and the same
// corners pushed far away from the light (2 and 3), tilted outward by the
// light's radius so the quad covers the edge's penumbras too. The fragment
// shader works out the actual coverage, so the quad only has to be big
// enough. Wall interiors are solid triangles (corner 4), always in shadow.
// Everything is moved to be relative to the light, which the mask is
// centered on.

in vec2 aPosition; // The edge's first corner (or a solid triangle's corner)
in vec2 aUV; // The edge's second corner (or the solid shape's middle)
in vec2 aNormal; // Outward normal of the edge
in float aCorner;

out vec2 vA;
out vec2 vB;
out vec2 vNormal;
out float vSolid;
out vec2 vPosition;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

// Where the light is, in world coordinates
uniform vec2 uLight;
// Half the width of the mask, in meters
uniform float uRadius;
// Radius of the light source, in meters (at least a pixel, for antialiasing)
uniform float uSourceRadius;

// Away from the light through `corner`, tilted away from `other` by the
// light's radius: the outer edge of all the shadow `corner` casts
vec2 outward(vec2 corner, vec2 other) {
  vec2 along = normalize(corner);
  vec2 across = vec2(-along.y, along.x);
  float side = dot(other - corner, across) >= 0.0 ? 1.0 : -1.0;
  return normalize(corner - across * side * uSourceRadius);
}

void main(void) {
  vec2 a = aPosition - uLight;
  vec2 b = aUV - uLight;
  vSolid = aCorner > 3.5 ? 1.0 : 0.0;
  vA = a;
  vB = b;
  vNormal = aNormal;

  vec2 position;
  // Only edges the light is behind (on their inner side) can block it from
  // anything, and only ones within reach of the mask (its corners are at
  // sqrt(2) * radius). The rest collapse to a point and draw nothing.
  vec2 ab = b - a;
  float t = clamp(dot(-a, ab) / max(dot(ab, ab), 1e-9), 0.0, 1.0);
  bool outOfReach = length(a + ab * t) > uRadius * 1.415;
  if (vSolid > 0.5) {
    // Interiors are drawn as they are; anything outside the mask is clipped
    position = a;
  } else if (outOfReach || dot(-a, aNormal) >= 0.0) {
    position = vec2(0.0);
  } else {
    // Far enough to reach past the mask's corners from anywhere in it
    float far = 3.0 * uRadius;
    if (aCorner < 0.5) {
      position = a;
    } else if (aCorner < 1.5) {
      position = b;
    } else if (aCorner < 2.5) {
      position = b + outward(b, a) * far;
    } else {
      position = a + outward(a, b) * far;
    }
  }
  vPosition = position;

  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(position, 1.0)).xy, 0.0, 1.0);
}
