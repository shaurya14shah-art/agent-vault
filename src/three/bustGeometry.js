/**
 * BUST GEOMETRY — the Sentinel's head and shoulders
 *
 * Humanoid volume, blank surface. The form has the anatomy of a head —
 * cranial mass, an occiput deeper than the face, cheekbones as the widest
 * point, a temple hollow, a jaw angle, a chin, a neck, shoulders — and none
 * of the identity: no eyes, no nose, no mouth, no ears, no skin.
 *
 * It's one continuous lofted skin rather than a pile of primitives, because
 * a head is defined by how its cross-section changes with height. So that is
 * what's authored: a stack of control rings, each with its own half-width and
 * its own *separate* front and back depth.
 *
 * Two details do most of the work:
 *
 *   1. Front and back depth are independent. A single depth value gives you
 *      an egg. A real skull is flat at the face and full at the back, and
 *      roughly 1.2× deeper than it is wide.
 *   2. Each axis gets its own superellipse exponent — a flat exponent at the
 *      front (broad face plane), a mild one at the sides (slabbed temples),
 *      a round one at the back. Plain ellipse cross-sections are the other
 *      reason generated heads look like eggs.
 *
 * Geometry is returned INDEXED so `computeVertexNormals()` produces shared,
 * smooth normals. Calling `toNonIndexed()` first is what makes it faceted.
 *
 * Tuned live in lab/sentinel-bust.html; these numbers are the approved ones.
 */

import * as THREE from 'three';

/* Control rings, bottom to top: [ y, halfWidth, depthFront, depthBack ] */
const CTRL = [
  /* shoulders */
  [-2.30, 1.88, 0.74, 0.86],
  [-2.12, 1.70, 0.73, 0.85],
  [-1.92, 1.34, 0.68, 0.80],
  /* trapezius sweeping up into the neck */
  [-1.72, 1.00, 0.60, 0.72],
  [-1.52, 0.76, 0.52, 0.62],
  /* neck */
  [-1.32, 0.55, 0.45, 0.53],
  [-1.12, 0.47, 0.42, 0.49],
  [-0.94, 0.45, 0.42, 0.48],
  /* jaw line — chin pushes forward, back stays short */
  [-0.82, 0.49, 0.58, 0.50],
  [-0.68, 0.58, 0.70, 0.58],
  [-0.52, 0.68, 0.77, 0.68],
  /* mouth / lower cheek */
  [-0.34, 0.77, 0.81, 0.78],
  [-0.16, 0.83, 0.83, 0.85],
  /* cheekbones — widest point of the head */
  [ 0.00, 0.87, 0.83, 0.90],
  /* eye line */
  [ 0.14, 0.855, 0.815, 0.925],
  /* brow ridge */
  [ 0.28, 0.838, 0.805, 0.940],
  /* temple hollow — the sides draw in above the brow */
  [ 0.44, 0.812, 0.775, 1.010],
  [ 0.60, 0.800, 0.755, 1.070],
  /* forehead into cranium */
  [ 0.80, 0.780, 0.740, 1.100],
  /* crown, following an ellipsoid cap: r = R·√(1−((y−y₀)/h)²).
     Tapering linearly to a point instead produces a pinched spike. */
  [ 0.95, 0.762, 0.723, 1.074],
  [ 1.10, 0.705, 0.669, 0.994],
  [ 1.25, 0.597, 0.567, 0.842],
  [ 1.36, 0.468, 0.444, 0.660],
  [ 1.44, 0.316, 0.300, 0.446],
  [ 1.48, 0.185, 0.176, 0.261],
  [ 1.50, 0.070, 0.066, 0.099],
  /* Carry the taper almost to zero — capping a ring that still has real
     radius leaves a visible cone pinned to the crown. */
  [ 1.512, 0.022, 0.021, 0.031],
];

const SEG = 84;           // angular resolution
const SUBDIV = 4;         // rings inserted between each control pair
const SMOOTH_PASSES = 6;  // neighbour averaging — this is what kills faceting

/* Superellipse exponents. Below 1 flattens an axis. */
const P_FRONT = 0.62;
const P_SIDE = 0.86;
const P_BACK = 1.0;

/* Insert intermediate rings, then relax them. Linear subdivision plus a few
   smoothing passes gives a cleaner curve than hand-tuned splines and can't
   overshoot into a bulge the way Catmull-Rom can. */
function loftRings(ctrl) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const a = ctrl[i];
    const b = ctrl[i + 1];
    for (let s = 0; s < SUBDIV; s++) {
      const t = s / SUBDIV;
      out.push([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t,
      ]);
    }
  }
  out.push(ctrl[ctrl.length - 1].slice());

  for (let p = 0; p < SMOOTH_PASSES; p++) {
    const snap = out.map((r) => r.slice());
    for (let i = 1; i < out.length - 1; i++) {
      for (let k = 1; k < 4; k++) {
        out[i][k] = snap[i - 1][k] * 0.25 + snap[i][k] * 0.5 + snap[i + 1][k] * 0.25;
      }
    }
  }
  return out;
}

const RINGS = loftRings(CTRL);

/** A point on the skin at one ring and angle. theta = 0 faces +Z. */
export function surfacePoint(ring, theta, swell = 1) {
  const [y, wx, df, db] = ring;
  const s = Math.sin(theta);
  const c = Math.cos(theta);

  const x = Math.sign(s) * Math.pow(Math.abs(s), P_SIDE) * wx * swell;
  const depth = c >= 0 ? df : db;
  const p = c >= 0 ? P_FRONT : P_BACK;
  const z = Math.sign(c) * Math.pow(Math.abs(c), p) * depth * swell;

  return [x, y, z];
}

/** Interpolated ring at an arbitrary height, so features can sit on the
    actual surface rather than at a guessed offset. */
export function ringAt(y) {
  if (y <= RINGS[0][0]) return RINGS[0];
  const top = RINGS[RINGS.length - 1];
  if (y >= top[0]) return top;

  for (let i = 0; i < RINGS.length - 1; i++) {
    const a = RINGS[i];
    const b = RINGS[i + 1];
    if (y >= a[0] && y <= b[0]) {
      const t = (y - a[0]) / (b[0] - a[0] || 1);
      return [
        y,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t,
      ];
    }
  }
  return top;
}

/** The skin. Indexed, smooth-shaded. */
export function buildBust() {
  const positions = [];
  const indices = [];

  positions.push(0, RINGS[0][0], 0);
  const BOTTOM = 0;

  const ringStart = [];
  for (const ring of RINGS) {
    ringStart.push(positions.length / 3);
    for (let j = 0; j < SEG; j++) {
      const theta = (j / SEG) * Math.PI * 2;
      const [x, y, z] = surfacePoint(ring, theta);
      positions.push(x, y, z);
    }
  }

  const APEX = positions.length / 3;
  const top = RINGS[RINGS.length - 1];
  // Close the dome almost flat. At this radius its normal already points
  // straight up, so a near-flat cap continues the curve; anything taller
  // creates a crease the rim light finds instantly.
  positions.push(0, top[0] + top[1] * 0.2, 0);

  // Bottom fan — reversed winding, since its apex sits below its ring.
  const first = ringStart[0];
  for (let j = 0; j < SEG; j++) {
    indices.push(BOTTOM, first + ((j + 1) % SEG), first + j);
  }

  for (let i = 0; i < RINGS.length - 1; i++) {
    const s0 = ringStart[i];
    const s1 = ringStart[i + 1];
    for (let j = 0; j < SEG; j++) {
      const jn = (j + 1) % SEG;
      indices.push(s0 + j, s0 + jn, s1 + jn, s0 + j, s1 + jn, s1 + j);
    }
  }

  const last = ringStart[RINGS.length - 1];
  for (let j = 0; j < SEG; j++) {
    indices.push(APEX, last + j, last + ((j + 1) % SEG));
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * The visor. Generated from the same surface function as the head, so it
 * stays welded to the face however the profile is retuned — and shaped as a
 * lens that tapers to nothing at the temples, so it reads as a slit cut into
 * the skull rather than a band stuck onto it.
 */
export function buildVisor({
  yMid = 0.175,
  halfHeight = 0.058,
  spread = 1.42,
  lift = 1.012,
} = {}) {
  const positions = [];
  const indices = [];
  const COLS = 80;
  const ROWS = 5;

  for (let r = 0; r <= ROWS; r++) {
    const v = r / ROWS;
    for (let cI = 0; cI <= COLS; cI++) {
      const u = (cI / COLS) * 2 - 1;
      const theta = spread * u;

      const h = halfHeight * (1 - Math.pow(Math.abs(u), 2.4));
      const y = yMid - h + h * 2 * v;

      // Lift falls off at the ends so the band sinks back into the cheek
      // instead of stopping dead in mid-air.
      const edge = 1 - Math.pow(Math.abs(u), 3);
      const [x, , z] = surfacePoint(ringAt(y), theta, 1 + (lift - 1) * edge);
      positions.push(x, y, z);
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let cI = 0; cI < COLS; cI++) {
      const a = r * (COLS + 1) + cI;
      const b = a + 1;
      const c = (r + 1) * (COLS + 1) + cI + 1;
      const d = (r + 1) * (COLS + 1) + cI;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
