/**
 * AGENT VAULT — landing
 *
 * The scroll spine:
 *   0.00 → hero holds. The Sentinel watches the cursor.
 *   0.00–0.55 (pinned) → the wordmark splits apart and leaves; the camera
 *          dollies into the construct and it comes apart with you.
 *   0.55–1.00 (pinned) → one line surfaces over it, then releases.
 *   → manifesto, index, disciplines, thanks.
 *
 * Everything after the pin is line-masked reveals on a shared rhythm, so the
 * page has one cadence instead of four competing ones.
 */

import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import VaultMark from '../three/VaultMark';
import Marquee from '../components/Marquee';
import Magnetic from '../components/Magnetic';
import Signal from '../components/Signal';
import { ThankYou, Footer, Marker } from '../components/Sections';
import { LIST } from '../lib/dossiers';
import {
  useIso, useLineReveal, useRise, useVelocitySkew, useViewport, useFitToWidth,
  ScrollTrigger, splitChars, damp, clamp,
} from '../lib/motion';

import '../styles/portfolio.css';

/* ── Camera rig ───────────────────────────────────────────────
   Reads a plain ref updated by ScrollTrigger. Keeping scroll out of React
   state means the pin never triggers a re-render. */

function CameraRig({ progressRef }) {
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = progressRef.current;

    // Dolly in and drop slightly as the pin plays out.
    const z = 6.4 - p * 2.5;
    const y = p * 0.42;

    state.camera.position.z = damp(state.camera.position.z, z, 0.02, dt);
    state.camera.position.y = damp(state.camera.position.y, y, 0.02, dt);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ── Hero ─────────────────────────────────────────────────── */

/**
 * The Sentinel's canvas layer. Rendered as a sibling of the hero, never
 * inside it — see the note on `.hero__stage`.
 *
 * Its fade is driven off `progressRef`, the value the hero's pinned timeline
 * already writes on every update, rather than off a second ScrollTrigger.
 *
 * A separate trigger on `.hero` does not work: pinning re-parents the hero
 * into a generated spacer and holds its bottom edge at the viewport bottom
 * for the whole pin, so `start: 'bottom 80%'` never resolves to the range you
 * think it does — the layer just stays at full opacity behind the rest of the
 * page. Reading the pin's own progress keeps the two in lockstep by
 * construction.
 */
function SentinelLayer({ progressRef }) {
  const layerRef = useRef(null);
  const { mobile } = useViewport();

  useIso(() => {
    const layer = layerRef.current;
    if (!layer) return;

    // Hold the bust while the wordmark leaves, then fade it out over the
    // back half of the pin so it's fully gone before the index arrives.
    const FADE_FROM = 0.5;
    const FADE_TO = 0.86;
    let last = -1;

    const tick = () => {
      const p = progressRef.current ?? 0;
      const o = 1 - clamp((p - FADE_FROM) / (FADE_TO - FADE_FROM), 0, 1);
      if (Math.abs(o - last) < 0.001) return;
      last = o;

      layer.style.opacity = o;
      // Once invisible, take it out of compositing entirely — an opacity-0
      // full-screen WebGL layer still costs a composite every frame.
      layer.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div className="hero__stage" ref={layerRef}>
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 38 }}
        dpr={[1, 1.75]}
        // Tone mapping matches the live preview the bust's materials were
        // tuned against; changing it changes the approved look.
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <CameraRig progressRef={progressRef} />
        {/* Offset right so the mark and the wordmark share the frame instead
            of fighting over the middle of it. */}
        <VaultMark
          progressRef={progressRef}
          offset={mobile ? [0, 0.25, 0] : [2.3, 0.15, 0]}
          scale={mobile ? 0.72 : 0.85}
        />
      </Canvas>
    </div>
  );
}

function Hero({ progressRef }) {
  const heroRef = useRef(null);
  const typeRef = useRef(null);
  const whisperRef = useRef(null);

  // Solve the wordmark's size against the real column width, before the
  // entry animation splits it into per-character inline-blocks.
  useFitToWidth(typeRef, '.hero__line', { max: 260 });

  useIso(() => {
    const ctx = gsap.context(() => {
      // Entry: the wordmark decodes character by character.
      const lines = gsap.utils.toArray('.hero__line');
      lines.forEach((line, i) => {
        const chars = splitChars(line);
        gsap.set(chars, { yPercent: 116, opacity: 0 });
        gsap.to(chars, {
          yPercent: 0,
          opacity: 1,
          duration: 1.35,
          delay: 1.9 + i * 0.1,
          stagger: { each: 0.035, from: i % 2 ? 'end' : 'start' },
          ease: 'expo.out',
        });
      });

      gsap.from(['.hero__sub', '.hero__corner'], {
        opacity: 0,
        y: 22,
        duration: 1.2,
        delay: 2.5,
        stagger: 0.08,
        ease: 'expo.out',
      });

      // The pin.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=2200',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => { progressRef.current = self.progress; },
        },
      });

      // Wordmark splits: odd lines leave right, even leave left.
      tl.to('.hero__line', {
        xPercent: (i) => (i % 2 ? 78 : -78),
        opacity: 0,
        letterSpacing: '0.08em',
        ease: 'power2.in',
        duration: 0.45,
        stagger: 0.03,
      }, 0)
        .to(['.hero__sub', '.hero__corner'], {
          opacity: 0, y: -20, duration: 0.25,
        }, 0)
        // Then the line surfaces, holds, and clears.
        .to(whisperRef.current, {
          opacity: 1, duration: 0.2, ease: 'power2.out',
        }, 0.5)
        .fromTo(whisperRef.current.querySelector('p'),
          { yPercent: 26, filter: 'blur(9px)' },
          { yPercent: 0, filter: 'blur(0px)', duration: 0.32, ease: 'power2.out' },
          0.5)
        .to(whisperRef.current, {
          opacity: 0, duration: 0.16, ease: 'power2.in',
        }, 0.86);
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero__type" ref={typeRef}>
        <span className="hero__line">Agent</span>
        <span className="hero__line hero__line--out">Vault</span>
        <p className="hero__sub">
          Four systems. One operator. Encryption, quantitative modelling,
          spatial computing, and a world that generates itself.
        </p>
      </div>

      <div className="hero__whisper" ref={whisperRef}>
        <p>Nobody funded this. Nobody staffed it. It shipped anyway.</p>
      </div>

      <div className="hero__corner hero__corner--bl">
        <span className="hint">
          <span className="hint__line" />
          Scroll to open
        </span>
      </div>
      <div className="hero__corner hero__corner--br">
        <span>Move your cursor — it&apos;s watching</span>
      </div>
    </section>
  );
}

/* ── Manifesto ────────────────────────────────────────────── */

function Manifesto() {
  const ref = useRef(null);
  const bodyRef = useRef(null);
  const asideRef = useRef(null);
  useLineReveal(bodyRef, { stagger: 0.1, duration: 1.25 });
  useLineReveal(asideRef, { stagger: 0.05, delay: 0.15 });
  useVelocitySkew(ref, { max: 3.2, selector: '.manifesto__body' });

  return (
    <section className="manifesto shell" ref={ref}>
      <Marker n="01" title="Position" right="Agent X" />
      <h2 className="manifesto__body" ref={bodyRef}>
        I build the whole thing. Kernel to cursor.
      </h2>
      <p className="t-lead manifesto__aside" ref={asideRef}>
        Rust cryptography, a nine-model quantitative ensemble, a voice agent
        that reaches into 3D space through your camera, and a procedurally
        generated open world — designed, written, and shipped by one person
        working alone. No team. No stack I inherited. The identity stays
        sealed; the work does not need it.
      </p>
    </section>
  );
}

/* ── Index ────────────────────────────────────────────────── */

function Index() {
  const ref = useRef(null);
  const peekRef = useRef(null);
  const activeRef = useRef(null);
  const [active, setActive] = useState(null);

  useRise(ref, { selector: '.row', y: 40, stagger: 0.07 });

  // The preview trails the cursor with its own damping — slower than the
  // cursor itself, so it reads as a separate object being dragged along.
  useEffect(() => {
    const peek = peekRef.current;
    if (!peek) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const setX = gsap.quickTo(peek, 'x', { duration: 0.95, ease: 'power3.out' });
    const setY = gsap.quickTo(peek, 'y', { duration: 0.95, ease: 'power3.out' });
    const setR = gsap.quickTo(peek, 'rotate', { duration: 1.1, ease: 'power3.out' });

    let px = 0;
    const onMove = (e) => {
      setX(e.clientX + 28);
      setY(e.clientY - 90);
      // Tilt into the direction of travel.
      setR(clamp((e.clientX - px) * 0.32, -9, 9));
      px = e.clientX;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const peek = peekRef.current;
    if (!peek) return;
    gsap.to(peek, {
      opacity: active ? 1 : 0,
      scale: active ? 1 : 0.92,
      duration: 0.5,
      ease: 'power3.out',
    });
  }, [active]);

  return (
    <section className="section shell index" ref={ref}>
      <Marker n="02" title="The Vault" right="04 dossiers" />

      {LIST.map((d) => (
        <Link
          key={d.id}
          to={d.slug}
          className="row"
          data-dossier={d.id}
          data-cursor="view"
          data-cursor-label="Open"
          onMouseEnter={() => { activeRef.current = d.id; setActive(d); }}
          onMouseLeave={() => {
            if (activeRef.current === d.id) { activeRef.current = null; setActive(null); }
          }}
        >
          <span className="row__n">{d.index}</span>
          <span className="row__name">{d.display}</span>
          <span className="row__meta">
            <span>{d.classification}</span>
            <span className="row__arrow">→</span>
          </span>
        </Link>
      ))}

      {/* Floating preview */}
      <div className="peek" ref={peekRef} data-dossier={active?.id}>
        {active && (
          <>
            <Signal id={active.id} accent={active.accent} />
            <div className="peek__tag">
              <span>{active.display}</span>
              <span style={{ color: active.accent }}>{active.index}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ── Disciplines ──────────────────────────────────────────── */

const DISCIPLINES = [
  ['Systems', 'Rust · Tauri'],
  ['Quantitative', 'Python · NumPy · SciPy'],
  ['Graphics', 'Three.js · WebGL · GLSL'],
  ['Interfaces', 'React · Next.js'],
  ['Machine learning', 'Ensembles · HMM · Bayesian'],
  ['Spatial', 'Hand tracking · Gesture'],
  ['Simulation', 'Physics · Procedural worlds'],
  ['Delivery', 'Electron · Native packaging'],
];

function Disciplines() {
  const ref = useRef(null);
  useRise(ref, { selector: '.disc__cell', y: 26, stagger: 0.035 });

  return (
    <section className="section shell" ref={ref}>
      <Marker n="03" title="Disciplines" right="Across four products" />
      <div className="disc">
        {DISCIPLINES.map(([k, v]) => (
          <div className="disc__cell" key={k} data-cursor="hover">
            <span className="disc__k">{k}</span>
            <span className="disc__v">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function Portfolio() {
  const pageRef = useRef(null);
  const progressRef = useRef(0);

  useIso(() => {
    // The hero pin changes document height after mount.
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="page" ref={pageRef}>
      <SentinelLayer progressRef={progressRef} />
      <Hero progressRef={progressRef} />

      <Marquee
        items={['Agent Vault', '✕', 'Built solo', '✕', 'Shipped', '✕']}
        speed={0.55}
      />

      <Manifesto />
      <Index />
      <Disciplines />

      <ThankYou
        line="You made it to the bottom of a page built by someone you will never meet. Take something with you — every dossier ends in a real download."
        sub="Agent X · Correspondence closed"
      >
        <div style={{ marginTop: 'var(--s-8)', display: 'flex', justifyContent: 'center' }}>
          <Magnetic strength={0.3}>
            <Link to="/agent-cipher" className="btn btn--lg" data-cursor="hide">
              Start with Cipher <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>
        </div>
      </ThankYou>

      <Marquee
        items={['Cipher', '·', 'Eminence', '·', 'Epsilon', '·', 'Game X', '·']}
        speed={0.4}
        direction={-1}
      />

      <Footer note="Four systems, one operator" />
    </div>
  );
}
