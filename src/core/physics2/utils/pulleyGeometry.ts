/**
 * Tangent-point and wrap-angle geometry for a rope passing around a
 * circular pulley/winch of finite radius.
 *
 * All math is done in 2D (the plane containing the two particles and
 * the pulley center). The results are lifted back to 3D world coords.
 */

export interface PulleyWrapResult {
  /** Tangent point on the circle nearest particle A (world coords). */
  tangentAx: number;
  tangentAy: number;
  tangentAz: number;
  /** Tangent point on the circle nearest particle B (world coords). */
  tangentBx: number;
  tangentBy: number;
  tangentBz: number;
  /** Unit direction from tangentA toward A (force direction on A). */
  tAx: number;
  tAy: number;
  tAz: number;
  /** Unit direction from tangentB toward B (force direction on B). */
  tBx: number;
  tBy: number;
  tBz: number;
  /** Straight-line distance from A to its tangent point. */
  straightA: number;
  /** Straight-line distance from B to its tangent point. */
  straightB: number;
  /** Wrap angle in radians (>= 0). */
  wrapAngle: number;
  /** Arc length = radius * wrapAngle. */
  arcLength: number;
  /** Radial angle of tangentA around pulley center (for arc interpolation). */
  tangentAAngle: number;
  /** Radial angle of tangentB around pulley center. */
  tangentBAngle: number;
  /** +1 or -1: direction to sweep from tangentAAngle to tangentBAngle. */
  wrapDirection: number;
  /** True if the computation fell back to point-pulley behaviour. */
  degenerate: boolean;
}

// Pre-allocated result object — mutated and returned each call (zero alloc).
const result: PulleyWrapResult = {
  tangentAx: 0,
  tangentAy: 0,
  tangentAz: 0,
  tangentBx: 0,
  tangentBy: 0,
  tangentBz: 0,
  tAx: 0,
  tAy: 0,
  tAz: 0,
  tBx: 0,
  tBy: 0,
  tBz: 0,
  straightA: 0,
  straightB: 0,
  wrapAngle: 0,
  arcLength: 0,
  tangentAAngle: 0,
  tangentBAngle: 0,
  wrapDirection: 1,
  degenerate: false,
};

function setDegenerate(
  px: number,
  py: number,
  pz: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
): PulleyWrapResult {
  result.tangentAx = px;
  result.tangentAy = py;
  result.tangentAz = pz;
  result.tangentBx = px;
  result.tangentBy = py;
  result.tangentBz = pz;
  // Directions toward A and B from pulley center
  let dAx = ax - px,
    dAy = ay - py,
    dAz = az - pz;
  const lenA = Math.sqrt(dAx * dAx + dAy * dAy + dAz * dAz);
  if (lenA > 1e-8) {
    const inv = 1 / lenA;
    dAx *= inv;
    dAy *= inv;
    dAz *= inv;
  } else {
    dAx = 1;
    dAy = 0;
    dAz = 0;
  }
  let dBx = bx - px,
    dBy = by - py,
    dBz = bz - pz;
  const lenB = Math.sqrt(dBx * dBx + dBy * dBy + dBz * dBz);
  if (lenB > 1e-8) {
    const inv = 1 / lenB;
    dBx *= inv;
    dBy *= inv;
    dBz *= inv;
  } else {
    dBx = -1;
    dBy = 0;
    dBz = 0;
  }
  result.tAx = dAx;
  result.tAy = dAy;
  result.tAz = dAz;
  result.tBx = dBx;
  result.tBy = dBy;
  result.tBz = dBz;
  result.straightA = lenA;
  result.straightB = lenB;
  result.wrapAngle = 0;
  result.arcLength = 0;
  result.tangentAAngle = 0;
  result.tangentBAngle = 0;
  result.wrapDirection = 1;
  result.degenerate = true;
  return result;
}

/**
 * Compute tangent points, wrap angle, and force directions for a rope
 * wrapping around a circular pulley.
 *
 * The rope comes from particle A, touches the circle tangentially,
 * follows an arc, then leaves tangentially toward particle B.
 *
 * @returns A pre-allocated result object (mutated each call — do not cache).
 */
export function computePulleyWrap(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  px: number,
  py: number,
  pz: number,
  radius: number,
): PulleyWrapResult {
  if (radius <= 0) {
    return setDegenerate(px, py, pz, ax, ay, az, bx, by, bz);
  }

  // --- Work in 2D in the plane containing A, P, B ---
  // Use P as origin. Build an orthonormal basis from the vectors PA and PB.

  const pax = ax - px,
    pay = ay - py,
    paz = az - pz;
  const pbx = bx - px,
    pby = by - py,
    pbz = bz - pz;

  const distA = Math.sqrt(pax * pax + pay * pay + paz * paz);
  const distB = Math.sqrt(pbx * pbx + pby * pby + pbz * pbz);

  // Degenerate: either particle is inside or on the circle
  if (distA <= radius || distB <= radius) {
    return setDegenerate(px, py, pz, ax, ay, az, bx, by, bz);
  }

  // Build 2D basis in the A-P-B plane.
  // e1 = normalize(PA)
  const e1x = pax / distA,
    e1y = pay / distA,
    e1z = paz / distA;

  // Project PB onto e1 to get perpendicular component
  const pbDotE1 = pbx * e1x + pby * e1y + pbz * e1z;
  let e2x = pbx - pbDotE1 * e1x;
  let e2y = pby - pbDotE1 * e1y;
  let e2z = pbz - pbDotE1 * e1z;
  const e2Len = Math.sqrt(e2x * e2x + e2y * e2y + e2z * e2z);

  if (e2Len < 1e-8) {
    // A, P, B are collinear — rope goes straight through, wrap = pi
    // Use any perpendicular direction for the basis
    // Find a non-parallel vector to e1
    if (Math.abs(e1x) < 0.9) {
      // cross(e1, (1,0,0)) = (0, e1z, -e1y)
      e2x = 0;
      e2y = e1z;
      e2z = -e1y;
    } else {
      // cross with (0,1,0)
      e2x = -e1z;
      e2y = 0;
      e2z = e1x;
    }
    const e2L2 = Math.sqrt(e2x * e2x + e2y * e2y + e2z * e2z);
    e2x /= e2L2;
    e2y /= e2L2;
    e2z /= e2L2;
  } else {
    e2x /= e2Len;
    e2y /= e2Len;
    e2z /= e2Len;
  }

  // 2D coords in the (e1, e2) basis: A = (distA, 0), B = (pbDotE1, bV)
  // P is at origin. bV = dot(PB, e2) = e2Len (always >= 0 by construction,
  // since e2 was derived from PB's component perpendicular to e1).
  // For the collinear case bV = 0.
  const bU = pbDotE1;
  const bV = e2Len < 1e-8 ? 0 : e2Len;

  // Angles of A and B as seen from center (P = origin) in 2D
  // A is always at angle 0 (along e1).
  const angleA = 0;
  const angleB = Math.atan2(bV, bU);

  // For each particle, the tangent from external point to circle:
  // tangent angle offset = acos(R/d), measured from center→particle direction
  const alphaA = Math.acos(radius / distA);
  const alphaB = Math.acos(radius / distB);

  // Straight-line distances along the tangent
  const straightA = Math.sqrt(distA * distA - radius * radius);
  const straightB = Math.sqrt(distB * distB - radius * radius);

  // Choose which tangent line to use for each particle.
  // The rope wraps on the side "between" A and B. We need the tangent
  // points that face each other (inner tangent lines).
  //
  // For A (at angle 0): inner tangent point is at angle (0 + alphaA) if B is
  // above (bV > 0), or (0 - alphaA) if B is below.
  // For B (at angle angleB): inner tangent point is at (angleB - alphaB) if B
  // is above, or (angleB + alphaB) if B is below.
  //
  // "Inner" means the tangent points are on the side of each particle
  // that faces the other particle.

  // Determine wrap direction from the cross product sign
  // cross(PA, PB) in 2D = distA * bV  (since A is at (distA, 0))
  const cross2d = distA * bV;
  // If cross > 0, B is counter-clockwise from A → rope wraps CCW
  // If cross ≈ 0 (collinear), pick either side consistently
  const wrapCCW = cross2d > 0 || (Math.abs(cross2d) < 1e-8 && bU < 0);

  let tangentAAngle2d: number;
  let tangentBAngle2d: number;

  if (wrapCCW) {
    // B is above → rope wraps CCW from A toward B
    // A's inner tangent point: rotate from angleA toward B = +alphaA
    tangentAAngle2d = angleA + alphaA;
    // B's inner tangent point: rotate from angleB toward A = -alphaB
    tangentBAngle2d = angleB - alphaB;
  } else {
    // B is below → rope wraps CW
    tangentAAngle2d = angleA - alphaA;
    tangentBAngle2d = angleB + alphaB;
  }

  // Wrap angle = angular span between the two tangent points, going
  // around the wrap side.
  let wrapAngle: number;
  if (wrapCCW) {
    wrapAngle = tangentBAngle2d - tangentAAngle2d;
    if (wrapAngle < 0) wrapAngle += 2 * Math.PI;
  } else {
    wrapAngle = tangentAAngle2d - tangentBAngle2d;
    if (wrapAngle < 0) wrapAngle += 2 * Math.PI;
  }

  // Clamp to [0, 2pi) — should already be, but safety
  if (wrapAngle < 0) wrapAngle = 0;
  if (wrapAngle > 2 * Math.PI) wrapAngle = 2 * Math.PI;

  const arcLength = radius * wrapAngle;

  // Tangent points in 2D
  const tAu = radius * Math.cos(tangentAAngle2d);
  const tAv = radius * Math.sin(tangentAAngle2d);
  const tBu = radius * Math.cos(tangentBAngle2d);
  const tBv = radius * Math.sin(tangentBAngle2d);

  // Lift back to 3D: point = P + u*e1 + v*e2
  result.tangentAx = px + tAu * e1x + tAv * e2x;
  result.tangentAy = py + tAu * e1y + tAv * e2y;
  result.tangentAz = pz + tAu * e1z + tAv * e2z;

  result.tangentBx = px + tBu * e1x + tBv * e2x;
  result.tangentBy = py + tBu * e1y + tBv * e2y;
  result.tangentBz = pz + tBu * e1z + tBv * e2z;

  // Tangent directions: from tangent point toward particle (unit vectors)
  let tAdx = ax - result.tangentAx;
  let tAdy = ay - result.tangentAy;
  let tAdz = az - result.tangentAz;
  if (straightA > 1e-8) {
    const inv = 1 / straightA;
    tAdx *= inv;
    tAdy *= inv;
    tAdz *= inv;
  }
  result.tAx = tAdx;
  result.tAy = tAdy;
  result.tAz = tAdz;

  let tBdx = bx - result.tangentBx;
  let tBdy = by - result.tangentBy;
  let tBdz = bz - result.tangentBz;
  if (straightB > 1e-8) {
    const inv = 1 / straightB;
    tBdx *= inv;
    tBdy *= inv;
    tBdz *= inv;
  }
  result.tBx = tBdx;
  result.tBy = tBdy;
  result.tBz = tBdz;

  result.straightA = straightA;
  result.straightB = straightB;
  result.wrapAngle = wrapAngle;
  result.arcLength = arcLength;
  result.tangentAAngle = tangentAAngle2d;
  result.tangentBAngle = tangentBAngle2d;
  result.wrapDirection = wrapCCW ? 1 : -1;
  result.degenerate = false;

  return result;
}
