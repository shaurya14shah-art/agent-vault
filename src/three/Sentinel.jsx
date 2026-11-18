/**
 * THE SENTINEL
 *
 * Agent X's avatar: a blank humanoid bust. Real head anatomy, no identity —
 * no eyes, no nose, no mouth, no ears, no skin. The only feature is a lit
 * visor slit cut across the brow.
 *
 * The skin is built by src/three/bustGeometry.js from an authored stack of
 * cross-sections. See that file for why a lofted profile rather than scaled
 * primitives — briefly: a scaled primitive is symmetric front-to-back and
 * featureless, which is why the previous version read as a prism.
 *
 * It behaves like a character rather than a prop:
 *   · it looks at you (the head tracks the pointer, damped, with a lag)
 *   · it breathes (idle float, and the visor pulses with a rare blink)
 *   · it reacts to the page moving (scroll velocity surges the visor and
 *     recoils the head slightly)
 *
 * Two things are deliberate and easy to "fix" wrongly:
 *
 *   Materials and lights are ported verbatim from the approved live preview
 *   (lab/sentinel-bust.html) and are tuned *together*. In particular there is
 *   no environment map here — the look was approved under three-point
 *   lighting alone, and adding one brightens the whole bust and flattens the
 *   form. Don't add StudioEnv to this scene.
 *
 *   Materials are declared as JSX rather than shared module singletons,
 *   because R3F disposes resources attached to a node when that node
 *   unmounts — a shared `material={SOME_MATERIAL}` is destroyed the first
 *   time this scene leaves the tree and every later mount renders dead.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildBust, buildVisor } from './bustGeometry';
import { pointer, scrollState, damp, clamp, lerp } from '../lib/motion';

/* Soft radial sprite standing in for bloom behind the visor. A flat plane
   with additive blending reads as a rectangle; this reads as light. Built
   once and marked `dispose={null}` at the use site so it survives unmount. */
let GLOW_TEX = null;
function glowTexture() {
  if (GLOW_TEX) return GLOW_TEX;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.4)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  GLOW_TEX = new THREE.CanvasTexture(c);
  GLOW_TEX.colorSpace = THREE.SRGBColorSpace;
  return GLOW_TEX;
}

export default function Sentinel({
  accent = '#b57bff',
  intensity = 1,
  offset = [0, 0, 0],
  scale = 1,
}) {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const visorRef = useRef(null);
  const glowRef = useRef(null);
  const haloRef = useRef(null);

  const bust = useMemo(() => buildBust(), []);
  const visor = useMemo(() => buildVisor(), []);
  useEffect(() => () => { bust.dispose(); visor.dispose(); }, [bust, visor]);

  const tex = glowTexture();
  const tint = useMemo(() => new THREE.Color(), []);
  const gaze = useRef({ x: 0, y: 0 });
  const surge = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    /* Scroll and pointer speed both count as disturbance. Fast to rise, slow
       to settle — that asymmetry is what makes it read as a reaction rather
       than a slider. */
    const fromPointer = clamp(pointer.speed / 130, 0, 1);
    const fromScroll = clamp(Math.abs(scrollState.velocity) * 1.4, 0, 1);
    const target = clamp(Math.max(fromPointer, fromScroll) * intensity, 0, 1);
    const smoothing = target > surge.current ? 0.0006 : 0.05;
    surge.current = damp(surge.current, target, smoothing, dt);

    /* Gaze: aim at the pointer, but never all the way. A construct that snaps
       to the cursor reads as a UI element, not a character. */
    const body = bodyRef.current;
    if (body) {
      gaze.current.y = damp(gaze.current.y, pointer.nx * 0.42, 0.006, dt);
      gaze.current.x = damp(gaze.current.x, -pointer.ny * 0.2, 0.006, dt);

      body.rotation.y = gaze.current.y + Math.sin(t * 0.24) * 0.045;
      body.rotation.x = gaze.current.x + Math.sin(t * 0.41) * 0.02;
      body.rotation.z = Math.sin(t * 0.2) * 0.014;

      // Breathe, and recoil a touch when the page moves under it.
      body.position.y = Math.sin(t * 0.75) * 0.035;
      body.position.z = -surge.current * 0.14;
    }

    /* Attention: how centred the pointer is on it. Feeds the visor. */
    const off = Math.hypot(pointer.nx, pointer.ny);
    const attention = clamp(1 - off * 0.7, 0, 1);

    const breath = 0.74 + Math.sin(t * 1.35) * 0.13;
    const blink = Math.sin(t * 0.31) > 0.995 ? 0.1 : 1;
    const level = breath * blink * (0.72 + attention * 0.4) + surge.current * 0.5;

    if (visorRef.current) {
      tint.set(accent).multiplyScalar(0.42 + level * 0.85);
      visorRef.current.material.color.copy(tint);
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.14 + level * 0.28;
      glowRef.current.scale.set(1.85 + level * 0.3, 0.36 + level * 0.14, 1);
    }
    if (haloRef.current) {
      haloRef.current.rotation.z += dt * 0.09;
      haloRef.current.scale.setScalar(1 + surge.current * 0.14);
    }

    /* The whole construct drifts slightly against the pointer, around
       whatever resting offset the page placed it at. */
    if (groupRef.current) {
      groupRef.current.position.x = damp(
        groupRef.current.position.x, offset[0] + pointer.nx * 0.12, 0.02, dt
      );
      groupRef.current.position.y = damp(
        groupRef.current.position.y, offset[1] + pointer.ny * 0.07, 0.02, dt
      );
    }
  });

  return (
    <>
      {/* Portrait lighting, not product lighting: a high key from
          camera-left, a weak warm bounce from the right, and a hard rim from
          behind that draws the jaw and cranium out of a near-black page. */}
      <ambientLight color="#30323c" intensity={1.1} />
      <directionalLight position={[-4.5, 5.2, 3.6]} intensity={2.5} color="#dfeaff" />
      <directionalLight position={[5.2, -1.4, 2.6]} intensity={0.75} color="#ffd9a8" />
      <directionalLight position={[-1.8, 2.6, -6]} intensity={3.4} color="#ffffff" />
      <pointLight position={[0, 0.6, -3.2]} intensity={26} distance={16} color={accent} />

      <group ref={groupRef} position={offset} scale={scale}>
        <group ref={bodyRef}>
          <mesh geometry={bust}>
            {/* Graphite pearl. Dark enough to sit in a near-black page,
                polished enough to describe the form. A mirror clearcoat here
                collects tight white specular blobs on the forehead and cheek
                that read as grease rather than polish. */}
            <meshPhysicalMaterial
              color="#212229"
              metalness={0.55}
              roughness={0.38}
              clearcoat={0.55}
              clearcoatRoughness={0.34}
              iridescence={0.16}
              iridescenceIOR={1.35}
              sheen={0.45}
              sheenColor="#8f9bd0"
            />
          </mesh>

          <mesh ref={visorRef} geometry={visor}>
            <meshBasicMaterial color={accent} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>

          <sprite ref={glowRef} position={[0, 0.175, 0.9]} scale={[1.9, 0.4, 1]}>
            <spriteMaterial
              map={tex}
              dispose={null}
              color={accent}
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        </group>

        {/* Halo — the one ornament, thin enough to read as jewellery. Outside
            the body group so it doesn't swing with the gaze. */}
        <mesh ref={haloRef} rotation={[1.38, 0, 0]} position={[0, 0.1, 0]}>
          <torusGeometry args={[1.72, 0.0055, 3, 160]} />
          <meshBasicMaterial color={accent} transparent opacity={0.34} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

export { lerp };
