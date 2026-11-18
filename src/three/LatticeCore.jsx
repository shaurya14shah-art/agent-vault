/**
 * LATTICE CORE — Agent Epsilon
 *
 * Two states in one scene, because the product is two things in one app.
 *
 *   mode 0 — TERMINAL. A lattice orb that pulses with speech amplitude,
 *            the way the real one does while Epsilon is listening or talking.
 *   mode 1 — DIRAC-DELTA. The orb opens out into a holographic grid and the
 *            tracked hand becomes the input device.
 *
 * The hand is real interaction, not decoration: five fingertips follow your
 * cursor into 3D space with per-finger lag, and the orb reacts when your hand
 * gets close to it.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pointer, damp, clamp, lerp } from '../lib/motion';

const ACCENT = '#b57bff';

/* ── Voice lattice ────────────────────────────────────────── */

function Orb({ modeRef, handRef }) {
  const wireRef = useRef(null);
  const innerRef = useRef(null);
  const coreRef = useRef(null);
  const tint = useMemo(() => new THREE.Color(), []);

  // Keep the rest positions so the pulse displaces from a clean sphere.
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2, 4), []);
  const base = useMemo(
    () => Float32Array.from(geometry.attributes.position.array),
    [geometry]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const mode = modeRef?.current ?? 0;

    // Synthetic speech envelope: a slow carrier with syllable-rate ripples.
    const amp =
      0.5 +
      Math.sin(t * 1.6) * 0.26 +
      Math.sin(t * 5.3) * 0.11 +
      Math.sin(t * 11.7) * 0.05;

    // Hand proximity — the orb leans away when your hand comes close.
    const handDist = handRef?.current?.dist ?? 5;
    const proximity = clamp(1 - handDist / 3.4, 0, 1);

    const pos = geometry.attributes.position;
    const arr = pos.array;

    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i], y = base[i + 1], z = base[i + 2];

      // Standing-wave displacement along the surface.
      const wave =
        Math.sin(x * 1.6 + t * 2.2) * 0.5 +
        Math.sin(y * 2.1 - t * 1.7) * 0.5 +
        Math.sin(z * 1.3 + t * 2.9) * 0.4;

      // In workspace mode the lattice relaxes and opens out.
      const d = wave * amp * lerp(0.16, 0.05, mode) + proximity * 0.12;
      const k = 1 + d;

      arr[i] = x * k;
      arr[i + 1] = y * k;
      arr[i + 2] = z * k;
    }
    pos.needsUpdate = true;

    if (wireRef.current) {
      wireRef.current.rotation.y += dt * 0.12;
      wireRef.current.rotation.x = damp(
        wireRef.current.rotation.x, -pointer.ny * 0.3, 0.02, dt
      );
      wireRef.current.scale.setScalar(lerp(1, 0.55, mode));
      wireRef.current.material.opacity = lerp(0.4, 0.12, mode);
    }

    if (innerRef.current) {
      innerRef.current.rotation.y -= dt * 0.3;
      innerRef.current.rotation.z += dt * 0.1;
      innerRef.current.scale.setScalar(lerp(0.62, 0.3, mode) * (1 + amp * 0.06));
    }

    if (coreRef.current) {
      coreRef.current.scale.setScalar((0.16 + amp * 0.12) * lerp(1, 0.6, mode));
      tint.setStyle(ACCENT).multiplyScalar(0.9 + amp * 1.6);
      coreRef.current.material.color.copy(tint);
    }
  });

  return (
    <group>
      <mesh ref={wireRef} geometry={geometry}>
        <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.4} toneMapped={false} />
      </mesh>

      <mesh ref={innerRef}>
        <icosahedronGeometry args={[2, 1]} />
        <meshBasicMaterial color="#edeae3" wireframe transparent opacity={0.14} />
      </mesh>

      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── Tracked hand ─────────────────────────────────────────────
   Five fingertips with staggered lag, joined back to a palm point. The lag
   is what makes it read as a hand being followed rather than five dots. */

const FINGERS = [
  { spread: -0.62, reach: 0.72, lag: 0.010 },
  { spread: -0.30, reach: 0.96, lag: 0.008 },
  { spread: 0.02,  reach: 1.04, lag: 0.007 },
  { spread: 0.32,  reach: 0.92, lag: 0.008 },
  { spread: 0.60,  reach: 0.66, lag: 0.012 },
];

function Hand({ modeRef, handRef }) {
  const groupRef = useRef(null);
  const tipRefs = useRef([]);
  const linesRef = useRef(null);
  const palm = useRef(new THREE.Vector3(0, 0, 3));
  const tips = useMemo(
    () => FINGERS.map(() => new THREE.Vector3(0, 0, 3)),
    []
  );

  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // 5 segments, 2 points each.
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(5 * 2 * 3), 3));
    return g;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const mode = modeRef?.current ?? 0;

    // Project the cursor onto a plane in front of the orb.
    const targetX = pointer.nx * 4.4;
    const targetY = pointer.ny * 2.6;

    palm.current.x = damp(palm.current.x, targetX, 0.006, dt);
    palm.current.y = damp(palm.current.y, targetY, 0.006, dt);
    palm.current.z = damp(palm.current.z, lerp(3.4, 2.2, mode), 0.02, dt);

    const arr = lineGeom.attributes.position.array;

    FINGERS.forEach((f, i) => {
      // Fingers splay from the palm and curl slightly as they trail.
      const curl = Math.sin(t * 1.4 + i * 0.7) * 0.09;
      const tx = palm.current.x + f.spread * (0.9 + mode * 0.4);
      const ty = palm.current.y + f.reach * 0.62 + curl;
      const tz = palm.current.z + 0.2;

      const v = tips[i];
      v.x = damp(v.x, tx, f.lag, dt);
      v.y = damp(v.y, ty, f.lag, dt);
      v.z = damp(v.z, tz, f.lag, dt);

      const m = tipRefs.current[i];
      if (m) {
        m.position.copy(v);
        m.rotation.z = t * 0.6 + i;
        m.scale.setScalar(0.05 + mode * 0.03);
      }

      const o = i * 6;
      arr[o] = palm.current.x;
      arr[o + 1] = palm.current.y;
      arr[o + 2] = palm.current.z;
      arr[o + 3] = v.x;
      arr[o + 4] = v.y;
      arr[o + 5] = v.z;
    });

    lineGeom.attributes.position.needsUpdate = true;

    if (linesRef.current) {
      linesRef.current.material.opacity = 0.12 + mode * 0.3;
    }

    // Publish the palm's distance from the orb so the orb can react.
    if (handRef) {
      handRef.current = { dist: palm.current.length() };
    }
  });

  return (
    <group ref={groupRef}>
      {FINGERS.map((_, i) => (
        <mesh key={i} ref={(el) => { tipRefs.current[i] = el; }}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#edeae3" wireframe transparent opacity={0.7} />
        </mesh>
      ))}

      <lineSegments ref={linesRef} geometry={lineGeom}>
        <lineBasicMaterial color={ACCENT} transparent opacity={0.2} />
      </lineSegments>
    </group>
  );
}

/* ── Holographic grid (workspace mode) ────────────────────── */

function HoloGrid({ modeRef }) {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const mode = modeRef?.current ?? 0;
    const g = groupRef.current;
    if (!g) return;

    g.visible = mode > 0.01;
    g.rotation.y += dt * 0.05;
    g.scale.setScalar(lerp(0.6, 1, mode));
    g.children.forEach((child, i) => {
      if (child.material) {
        child.material.opacity = mode * (0.16 - i * 0.03);
      }
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {[0, 1, 2].map((i) => (
        <gridHelper
          key={i}
          args={[16, 16, ACCENT, '#3a3a46']}
          position={[0, -2.6 + i * 2.6, 0]}
        />
      ))}
    </group>
  );
}

/* ── Scene ────────────────────────────────────────────────── */

export default function LatticeCore({ modeRef }) {
  const handRef = useRef({ dist: 5 });

  return (
    <>
      <fog attach="fog" args={['#060607', 9, 26]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={14} distance={14} color={ACCENT} />

      <Orb modeRef={modeRef} handRef={handRef} />
      <Hand modeRef={modeRef} handRef={handRef} />
      <HoloGrid modeRef={modeRef} />
    </>
  );
}
