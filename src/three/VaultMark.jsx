/**
 * THE MARK — hero object
 *
 * Agent Vault's logo, rendered as the thing itself rather than a decal in a
 * corner. It replaces the earlier bust: an abstract sculptural knot says
 * "vault" in a way a mannequin never did, and it means the identity mark and
 * the hero object are the same object.
 *
 * It has a job, not just an idle spin. The band starts sealed — one full
 * turn of twist — and *unwinds* as you scroll the hero, so the form opens
 * while the page tells you to "scroll to open". Cursor tilts it; scroll
 * velocity spins it.
 *
 * The twist is animated by rewriting vertex positions on the CPU, which is
 * only affordable because it's gated: the rebuild is skipped entirely unless
 * the twist has actually moved. At rest this costs nothing.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { buildMark, writeMarkPositions, MARK } from './markGeometry';
import { pointer, scrollState, damp, clamp, lerp } from '../lib/motion';

export default function VaultMark({
  offset = [0, 0, 0],
  scale = 1,
  progressRef,
  // Not the logo's pure white. At hero scale on a near-black page a white
  // object is the loudest thing on screen and buries the wordmark; a soft
  // grey-bone keeps the form and lets the type lead. Push toward #e9e6df if
  // you want it to carry more.
  tone = '#b8b4aa',
}) {
  const groupRef = useRef(null);
  const spinRef = useRef(null);
  const meshRef = useRef(null);

  const geometry = useMemo(() => buildMark(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const lastTwist = useRef(MARK.twistTurns);
  const spin = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const p = progressRef?.current ?? 0;

    /* ── The work: unseal ──────────────────────────────────────
       One full turn of twist at rest, unwinding to nearly flat as the hero
       plays out.

       Mapped over the first half of the pin, not the whole of it, and that
       matters: the silhouette barely changes until the twist drops below a
       quarter turn (above that the band still swings fully edge-on
       somewhere along its length, so it looks identical). Finishing the
       unwind by 0.5 puts the part you can actually see inside the window
       where the layer is still at full opacity — the fade starts at 0.5. */
    const targetTwist = lerp(MARK.twistTurns, 0.06, clamp(p / 0.5, 0, 1));

    if (Math.abs(targetTwist - lastTwist.current) > 0.0015) {
      lastTwist.current = targetTwist;
      writeMarkPositions(geometry.attributes.position.array, targetTwist);
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    /* ── Motion ────────────────────────────────────────────── */
    if (spinRef.current) {
      // Constant slow turn, plus a kick from how fast the page is moving.
      spin.current += dt * (0.14 + Math.abs(scrollState.velocity) * 1.1);
      spinRef.current.rotation.z = spin.current;
    }

    if (groupRef.current) {
      const g = groupRef.current;

      // Lean toward the cursor, damped — the object acknowledges you.
      tilt.current.y = damp(tilt.current.y, pointer.nx * 0.5, 0.006, dt);
      tilt.current.x = damp(tilt.current.x, -pointer.ny * 0.38, 0.006, dt);

      g.rotation.y = tilt.current.y + Math.sin(t * 0.26) * 0.08;
      g.rotation.x = tilt.current.x + Math.sin(t * 0.37) * 0.05;

      g.position.x = damp(g.position.x, offset[0] + pointer.nx * 0.1, 0.02, dt);
      g.position.y = damp(
        g.position.y, offset[1] + pointer.ny * 0.06 + Math.sin(t * 0.7) * 0.04, 0.02, dt
      );
    }
  });

  return (
    <>
      {/* Soft product-shot lighting. The mark is matte and chalky, so the
          form has to be described by broad shading rather than highlights —
          a hemisphere light does most of that, the directionals just shape
          it. Any real specular here and it reads as plastic. */}
      <hemisphereLight args={['#eceae6', '#0a0a0c', 0.85]} />
      <ambientLight color="#2a2c33" intensity={0.4} />
      <directionalLight position={[-3.4, 4.6, 3.2]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[4.4, -1.2, 2.4]} intensity={0.35} color="#dfe6ff" />
      <directionalLight position={[-1.2, 1.6, -5]} intensity={0.7} color="#ffffff" />

      <group ref={groupRef} position={offset} scale={scale}>
        <group ref={spinRef}>
          {/* Stood on a corner, so the mark reads as a diamond. */}
          <mesh ref={meshRef} geometry={geometry} rotation={[0, 0, Math.PI / 4]}>
            <meshPhysicalMaterial
              color={tone}
              metalness={0}
              roughness={0.62}
              clearcoat={0.12}
              clearcoatRoughness={0.7}
              sheen={0.6}
              sheenRoughness={0.9}
              sheenColor="#bfc6da"
              side={2 /* THREE.DoubleSide — the band is open at the edges */}
            />
          </mesh>
        </group>
      </group>
    </>
  );
}
