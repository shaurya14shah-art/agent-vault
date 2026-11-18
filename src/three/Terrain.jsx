/**
 * TERRAIN — Game X
 *
 * The site's landscape is generated the same way the game's is: fBm over a
 * chunked grid, resolved as it comes toward you. Scrolling flies you forward
 * through it, and the biome colour shifts as you travel — so the page is a
 * flythrough of the thing it's describing rather than a picture of it.
 *
 * The grid is a fixed plane whose vertices are re-evaluated against a moving
 * world offset, which is exactly the trick the game's chunk manager uses:
 * the mesh never moves, the sample window does.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fbm } from './noise';
import { pointer, damp, clamp } from '../lib/motion';

const SEG_X = 96;
const SEG_Z = 72;
const WIDTH = 60;
const DEPTH = 46;

/* Palettes sampled across the biome list — the terrain tints as you travel. */
const BIOME_COLORS = [
  '#ff5540', // crimson rift
  '#ffa23d', // volcanic
  '#7be3a0', // verdant
  '#5fc9ff', // frozen
  '#b57bff', // astral
  '#ff5540',
];

export default function Terrain({ travelRef }) {
  const meshRef = useRef(null);
  const glowRef = useRef(null);
  const groupRef = useRef(null);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(WIDTH, DEPTH, SEG_X, SEG_Z);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const base = useMemo(
    () => Float32Array.from(geometry.attributes.position.array),
    [geometry]
  );

  const colorA = useMemo(() => new THREE.Color(), []);
  const colorB = useMemo(() => new THREE.Color(), []);
  const tint = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Travel: scroll pushes it forward, and it drifts on its own so the world
    // is alive even when you stop.
    const travel = (travelRef?.current ?? 0) * 160 + t * 1.1;

    const pos = geometry.attributes.position;
    const arr = pos.array;

    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];

      // Sample window slides; the mesh stays put.
      const wz = z + travel;

      const continent = fbm(x * 0.022, wz * 0.022, 4) * 5.4;
      const ridges = Math.abs(fbm(x * 0.075, wz * 0.075, 3)) * 2.1;
      const detail = fbm(x * 0.22, wz * 0.22, 2) * 0.42;

      // Flatten toward the horizon so the far edge doesn't turn to noise.
      const depthFade = 1 - clamp(Math.abs(z) / (DEPTH * 0.62), 0, 1) * 0.35;

      arr[i + 1] = (continent + ridges + detail) * depthFade;
    }

    pos.needsUpdate = true;

    // Biome tint — a slow walk along the palette.
    const p = (travel * 0.0032) % BIOME_COLORS.length;
    const i0 = Math.floor(p) % BIOME_COLORS.length;
    const i1 = (i0 + 1) % BIOME_COLORS.length;
    colorA.set(BIOME_COLORS[i0]);
    colorB.set(BIOME_COLORS[i1]);
    tint.copy(colorA).lerp(colorB, p - Math.floor(p));

    if (meshRef.current) meshRef.current.material.color.copy(tint);
    if (glowRef.current) {
      glowRef.current.material.color.copy(tint);
      glowRef.current.material.opacity = 0.05 + Math.sin(t * 0.8) * 0.015;
    }

    if (groupRef.current) {
      // Banking with the cursor — you're steering the flythrough.
      groupRef.current.rotation.z = damp(
        groupRef.current.rotation.z, pointer.nx * 0.09, 0.02, dt
      );
      groupRef.current.position.y = damp(
        groupRef.current.position.y, -5.4 + pointer.ny * 0.5, 0.02, dt
      );
    }
  });

  return (
    <>
      <fog attach="fog" args={['#060607', 14, 40]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 6]} intensity={0.8} color="#ffd9c0" />

      <group ref={groupRef} position={[0, -5.4, 0]}>
        <mesh ref={meshRef} geometry={geometry}>
          <meshBasicMaterial wireframe transparent opacity={0.42} toneMapped={false} />
        </mesh>

        {/* A dim solid pass under the wire so the ridges occlude properly */}
        <mesh ref={glowRef} geometry={geometry} position={[0, -0.08, 0]}>
          <meshBasicMaterial transparent opacity={0.06} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
