/**
 * VOLATILITY SURFACE — Agent Eminence
 *
 * A wireframe surface standing in for what the ensemble actually looks at.
 * Scrolling drives `converge`: at the top the surface is loud and disordered
 * (nine models disagreeing); by the bottom the noise has been weighted down
 * and a clean trend surface is left — the meta-learner having done its work.
 *
 * Vertices are displaced on the CPU because the displacement has to stay in
 * sync with the same fBm the page's other visuals use.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StudioEnv from './StudioEnv';
import { fbm } from './noise';
import { pointer, damp, lerp } from '../lib/motion';

const ACCENT = '#e5b451';
const SEG = 68;
const SIZE = 26;

export default function VolatilitySurface({ convergeRef }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const ridgeRef = useRef(null);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  // Keep the flat rest positions so each frame displaces from a clean base.
  const base = useMemo(
    () => Float32Array.from(geometry.attributes.position.array),
    [geometry]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const converge = convergeRef?.current ?? 0;

    const pos = geometry.attributes.position;
    const arr = pos.array;

    // As the ensemble converges: less chaos, more trend, lower amplitude.
    const chaos = lerp(1.5, 0.16, converge);
    const trend = lerp(0.35, 1.25, converge);
    const octaves = converge > 0.55 ? 2 : 4;

    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];

      const disorder = fbm(x * 0.16 + t * 0.1, z * 0.16 - t * 0.06, octaves) * chaos;
      // The signal the models are all trying to find.
      const signal = Math.sin(x * 0.22 + t * 0.35) * Math.cos(z * 0.17 - t * 0.2) * trend;

      arr[i + 1] = disorder + signal;
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();

    if (groupRef.current) {
      // Tilt with the pointer — you're leaning over the surface.
      groupRef.current.rotation.x = damp(
        groupRef.current.rotation.x, -0.32 + pointer.ny * 0.14, 0.02, dt
      );
      groupRef.current.rotation.z = damp(
        groupRef.current.rotation.z, pointer.nx * 0.13, 0.02, dt
      );
      groupRef.current.position.y = damp(
        groupRef.current.position.y, -1.6 + converge * 0.5, 0.03, dt
      );
    }

    // A single bright contour that firms up as the models agree.
    if (ridgeRef.current) {
      ridgeRef.current.material.opacity = 0.1 + converge * 0.55;
      ridgeRef.current.position.y = 0.02 + converge * 0.25;
      ridgeRef.current.rotation.z += dt * 0.05;
    }
  });

  return (
    <>
      <StudioEnv intensity={0.4} />
      <fog attach="fog" args={['#060607', 12, 34]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 9, 4]} intensity={1.1} color="#fff0d0" />
      <pointLight position={[0, 5, 0]} intensity={22} distance={26} color={ACCENT} />

      <group ref={groupRef} position={[0, -1.6, 0]}>
        <mesh ref={meshRef} geometry={geometry}>
          <meshBasicMaterial
            color={ACCENT}
            wireframe
            transparent
            opacity={0.34}
            toneMapped={false}
          />
        </mesh>

        {/* Consensus ring */}
        <mesh ref={ridgeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[3.4, 3.42, 128]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </>
  );
}
