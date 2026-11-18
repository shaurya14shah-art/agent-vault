/**
 * VAULT LATTICE — Agent Cipher
 *
 * A wireframe cage around a solid core. Scrolling *seals* it: the cage
 * contracts onto the core, the locking ring spins up and stops hard, and the
 * core's glow is snuffed out. The page's scroll is literally the act of
 * encrypting something.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pointer, damp, clamp, lerp } from '../lib/motion';

const ACCENT = '#7cf5d5';

export default function VaultLattice({ sealRef }) {
  const groupRef = useRef(null);
  const cageRef = useRef(null);
  const innerRef = useRef(null);
  const coreRef = useRef(null);
  const ringRef = useRef(null);
  const barsRef = useRef(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Locking bars: eight radial pins that drive inward as the seal closes.
  const bars = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      offset: Math.random() * 0.3,
    })),
    []
  );

  // Scratch colour, applied to the core's own JSX material each frame. A
  // shared material instance passed via `material={…}` would be disposed by
  // R3F when this scene unmounts, so every later mount would render dead.
  const tint = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const seal = sealRef?.current ?? 0;

    if (groupRef.current) {
      // Tilts toward the pointer — you're handling the object.
      groupRef.current.rotation.y = damp(
        groupRef.current.rotation.y, pointer.nx * 0.45, 0.02, dt
      );
      groupRef.current.rotation.x = damp(
        groupRef.current.rotation.x, -pointer.ny * 0.32, 0.02, dt
      );
    }

    if (cageRef.current) {
      cageRef.current.rotation.y += dt * 0.14;
      cageRef.current.rotation.z += dt * 0.05;
      // Contracts onto the core.
      cageRef.current.scale.setScalar(lerp(1, 0.58, seal));
    }

    if (innerRef.current) {
      innerRef.current.rotation.y -= dt * 0.22;
      innerRef.current.rotation.x += dt * 0.09;
      innerRef.current.scale.setScalar(lerp(0.78, 0.54, seal));
    }

    if (coreRef.current) {
      // Breathes while open; goes dark and small once sealed.
      const pulse = 1 + Math.sin(t * 2.1) * 0.06 * (1 - seal);
      coreRef.current.scale.setScalar(lerp(0.46, 0.3, seal) * pulse);
      tint.setStyle(ACCENT).multiplyScalar(lerp(1.5, 0.12, seal));
      coreRef.current.material.color.copy(tint);
    }

    if (ringRef.current) {
      // Spins up hard through the first half of the seal, then locks.
      const spin = seal < 0.72 ? seal * 9 : 0;
      ringRef.current.rotation.z += dt * (0.4 + spin);
      ringRef.current.scale.setScalar(lerp(1, 0.72, seal));
    }

    if (barsRef.current) {
      bars.forEach((b, i) => {
        const localSeal = clamp((seal - b.offset * 0.4) / 0.6, 0, 1);
        const r = lerp(1.9, 0.62, localSeal);
        dummy.position.set(Math.cos(b.angle) * r, Math.sin(b.angle) * r, 0);
        dummy.rotation.set(0, 0, b.angle + Math.PI / 2);
        dummy.scale.set(0.035, lerp(0.18, 0.42, localSeal), 0.035);
        dummy.updateMatrix();
        barsRef.current.setMatrixAt(i, dummy.matrix);
      });
      barsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#dff7ff" />
      <pointLight position={[0, 0, 2]} intensity={5} distance={9} color={ACCENT} />

      <group ref={groupRef}>
        {/* Outer cage */}
        <mesh ref={cageRef}>
          <icosahedronGeometry args={[2.15, 1]} />
          <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.34} />
        </mesh>

        {/* Inner cage, counter-rotating */}
        <mesh ref={innerRef}>
          <octahedronGeometry args={[2.15, 2]} />
          <meshBasicMaterial color="#edeae3" wireframe transparent opacity={0.12} />
        </mesh>

        {/* The payload */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>

        {/* Locking ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[2.5, 0.012, 3, 96]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.5} toneMapped={false} />
        </mesh>

        {/* Locking bars */}
        <instancedMesh ref={barsRef} args={[undefined, undefined, bars.length]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.7} toneMapped={false} />
        </instancedMesh>
      </group>
    </>
  );
}
