/**
 * THE MARK — Agent Vault's logo, as geometry
 *
 * A closed band running around a rounded-square path, twisting as it goes so
 * the surface turns from face-on to edge-on and back. That twist is the whole
 * character of the form: it's what makes a plain ring read as a sculpture,
 * and it's what produces the crossings in the silhouette.
 *
 * Built as a parametric surface rather than a TubeGeometry, because a tube
 * has a circular section and this needs a flat *ribbon* whose section rotates
 * along the path.
 *
 * The frame is deliberately NOT Frenet. A planar curve has zero torsion and
 * its Frenet normal flips at inflection points, which would crease the
 * surface. Instead the band rides a fixed out-of-plane binormal and all
 * rotation comes from the twist term — so the twist is exactly what's
 * authored, nothing more.
 *
 * Tuned live in lab/vault-mark.html against the supplied logo.
 */

import * as THREE from 'three';

export const MARK = {
  R: 1.0,            // loop radius
  squareness: 3.0,   // superellipse exponent — 2 = circle, higher = squarer
  ribbonW: 0.40,     // half-width of the band (the broad face)
  ribbonT: 0.125,    // half-thickness (the edge)
  // One turn, not two. Two gives four edge-on crossings and the silhouette
  // goes frilly; one gives the two clean crossings the logo has.
  twistTurns: 1,
  uSeg: 300,
  vSeg: 26,
};

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _p = new THREE.Vector3();
const _t = new THREE.Vector3();
const _n = new THREE.Vector3();
const B_AXIS = new THREE.Vector3(0, 0, 1);

/** Rounded-square path. Superellipse: |x|ⁿ + |y|ⁿ = Rⁿ */
function pathPoint(t, out, P) {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const e = 2 / P.squareness;
  return out.set(
    Math.sign(c) * Math.pow(Math.abs(c), e) * P.R,
    Math.sign(s) * Math.pow(Math.abs(s), e) * P.R,
    0
  );
}

/**
 * Write the surface into an existing position array. Separated from geometry
 * creation so the twist can be animated without reallocating every frame.
 */
export function writeMarkPositions(arr, twist, P = MARK) {
  const { uSeg, vSeg, ribbonW, ribbonT } = P;
  let i = 0;

  for (let u = 0; u <= uSeg; u++) {
    const t = (u / uSeg) * Math.PI * 2;

    pathPoint(t, _p, P);
    // Tangent by central difference — stable at the corners, where an
    // analytic derivative of the superellipse blows up.
    const h = 0.0015;
    pathPoint(t + h, _a, P);
    pathPoint(t - h, _b, P);
    _t.subVectors(_a, _b).normalize();
    _n.crossVectors(_t, B_AXIS).normalize();

    const phi = twist * t;
    const cp = Math.cos(phi);
    const sp = Math.sin(phi);

    for (let v = 0; v <= vSeg; v++) {
      const th = (v / vSeg) * Math.PI * 2;
      // Elliptical section: broad face, rounded edges, no hard corners.
      const la = ribbonW * Math.cos(th);
      const lb = ribbonT * Math.sin(th);

      const dn = la * cp - lb * sp;
      const db = la * sp + lb * cp;

      arr[i++] = _p.x + _n.x * dn;
      arr[i++] = _p.y + _n.y * dn;
      arr[i++] = _p.z + db;      // binormal is +Z, so this is the only term
    }
  }
}

export function buildMark(P = MARK) {
  const { uSeg, vSeg } = P;
  const count = (uSeg + 1) * (vSeg + 1);
  const positions = new Float32Array(count * 3);
  writeMarkPositions(positions, P.twistTurns, P);

  const indices = [];
  const row = vSeg + 1;
  for (let u = 0; u < uSeg; u++) {
    for (let v = 0; v < vSeg; v++) {
      const a = u * row + v;
      const b = a + row;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
