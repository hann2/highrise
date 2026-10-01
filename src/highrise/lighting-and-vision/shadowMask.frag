// How much of a light one wall edge hides from this point (see
// shadowMask.vert), added up into the light's shadow mask.
//
// The light is a disc of radius vSourceRadius at the origin. The edge hides
// the part of the disc that lies between the two lines from this point
// through the edge's corners, as long as the edge is between the point and
// the light: the point on the edge's outer side, the light on its inner side.
// For a convex shape the edges facing a point cover what the shape hides
// from it exactly once, so their coverage adds up exactly. The fraction of
// the disc on one side of a line is the area of a circular segment.

precision highp float;

in vec2 vA;
in vec2 vB;
in vec2 vNormal;
in float vSolid;
in vec2 vPosition;
in float vHalfSize;
in float vSourceRadius;

out vec4 finalColor;

// Fraction of a disc on the negative side of a line at signed distance `x`
// (in radii) from its center. The exact area is
// 0.5 + (x * sqrt(1 - x * x) + asin(x)) / PI; a smoothstep is within 2% of
// it and much cheaper, and there are a lot of these pixels.
float discFraction(float x) {
  return smoothstep(-1.0, 1.0, x);
}

float cross2(vec2 u, vec2 v) {
  return u.x * v.y - u.y * v.x;
}

void main(void) {
  vec2 p = vPosition;
  if (any(greaterThan(abs(p), vec2(vHalfSize)))) {
    // Outside this light's square of the page, which is some other light's
    discard;
  }
  if (vSolid > 0.5) {
    finalColor = vec4(1.0);
    return;
  }
  if (dot(p - vA, vNormal) <= 0.0) {
    // On the edge's inner side: an edge facing it does the hiding
    discard;
  }
  vec2 toLight = -p;
  // Signed distance of the light's center from the line from this point
  // through each corner, in light radii: a line at angle theta from the
  // direction of the light passes distance * sin(theta) from its center
  vec2 da = vA - p;
  vec2 db = vB - p;
  float sa = cross2(toLight, da) / (length(da) * vSourceRadius);
  float sb = cross2(toLight, db) / (length(db) * vSourceRadius);
  // Corners behind this point (away from the light) are past the disc
  if (dot(toLight, da) < 0.0) {
    sa = sign(sa) * 1e6;
  }
  if (dot(toLight, db) < 0.0) {
    sb = sign(sb) * 1e6;
  }
  float lo = min(sa, sb);
  float hi = max(sa, sb);
  if (lo >= 1.0 || hi <= -1.0) {
    // Both lines pass the disc on the same side: none of it is hidden
    discard;
  }
  if (lo <= -1.0 && hi >= 1.0) {
    // All of it is: the umbra, which is most of what gets drawn
    finalColor = vec4(1.0);
    return;
  }
  finalColor = vec4(discFraction(hi) - discFraction(lo));
}
