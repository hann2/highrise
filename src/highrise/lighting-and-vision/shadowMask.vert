#version 300 es
// Shadows from the level's walls, drawn once per light (instanced) into
// that light's square of a page of the shadow mask atlas (see ShadowCasters
// and LightAtlas). Every wall edge is a quad: its two corners (0 and 1), and
// the same corners pushed far away from the light (2 and 3), tilted outward
// by the light's radius so the quad covers the edge's penumbras too. The
// fragment shader works out the actual coverage, so the quad only has to be
// big enough, and throws away whatever lands outside the light's square.
// Wall interiors are solid triangles (corner 4), always in shadow.

// Per vertex
in vec2 aPosition; // The edge's first corner (or a solid triangle's corner)
in vec2 aUV; // The edge's second corner (or the solid shape's lower bounds)
in vec2 aNormal; // Outward normal of the edge (or the solid shape's upper bounds)
in float aCorner;

// Per light
in vec2 aLight; // Where the light is, in the world
in vec2 aLightSize; // Half the width of its square, and its source radius
in vec2 aSlot; // The middle of its square in the page

out vec2 vA;
out vec2 vB;
out vec2 vNormal;
out float vSolid;
out vec2 vPosition;
out float vHalfSize;
out float vSourceRadius;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

// Away from the light through `corner`, tilted away from `other` by the
// light's radius: the outer edge of all the shadow `corner` casts
vec2 outward(vec2 corner, vec2 other, float sourceRadius) {
  vec2 along = normalize(corner);
  vec2 across = vec2(-along.y, along.x);
  float side = dot(other - corner, across) >= 0.0 ? 1.0 : -1.0;
  return normalize(corner - across * side * sourceRadius);
}

void main(void) {
  float halfSize = aLightSize.x;
  float sourceRadius = aLightSize.y;
  // Everything relative to the light
  vec2 a = aPosition - aLight;
  vec2 b = aUV - aLight;
  vSolid = aCorner > 3.5 ? 1.0 : 0.0;
  vA = a;
  vB = b;
  vNormal = aNormal;
  vHalfSize = halfSize;
  vSourceRadius = sourceRadius;

  vec2 position;
  // Only edges the light is behind (on their inner side) can block it from
  // anything, and only ones within reach of its square (whose corners are
  // sqrt(2) * halfSize away). The rest collapse to a point and draw nothing.
  vec2 ab = b - a;
  float t = clamp(dot(-a, ab) / max(dot(ab, ab), 1e-9), 0.0, 1.0);
  bool outOfReach = length(a + ab * t) > halfSize * 1.415;
  if (vSolid > 0.5) {
    // Interiors are drawn as they are, if their bounding box (aUV to aNormal)
    // is in reach; the fragment shader throws away what's outside the square
    vec2 lower = aUV - aLight;
    vec2 upper = aNormal - aLight;
    bool overlaps = all(lessThan(lower, vec2(halfSize))) &&
      all(greaterThan(upper, vec2(-halfSize)));
    position = overlaps ? a : vec2(0.0);
  } else if (outOfReach || dot(-a, aNormal) >= 0.0) {
    position = vec2(0.0);
  } else {
    // Far enough to reach past the square's corners from anywhere in it
    float far = 3.0 * halfSize;
    if (aCorner < 0.5) {
      position = a;
    } else if (aCorner < 1.5) {
      position = b;
    } else if (aCorner < 2.5) {
      position = b + outward(b, a, sourceRadius) * far;
    } else {
      position = a + outward(a, b, sourceRadius) * far;
    }
  }
  vPosition = position;

#ifdef GL_ANGLE_clip_cull_distance
  // The edges of the light's square, so the GPU clips what reaches past it
  // (see ShadowCasters.draw); else the fragment shader throws it away
  gl_ClipDistance[0] = halfSize + position.x;
  gl_ClipDistance[1] = halfSize - position.x;
  gl_ClipDistance[2] = halfSize + position.y;
  gl_ClipDistance[3] = halfSize - position.y;
#endif

  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aSlot + position, 1.0)).xy, 0.0, 1.0);
}
