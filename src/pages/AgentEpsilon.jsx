/**
 * AGENT EPSILON — 03
 *
 * Landing interaction: your cursor is a tracked hand. Five fingertips follow
 * it into the scene with per-finger lag and the lattice reacts when the hand
 * comes near — the same input model the real Dirac-Delta workspace uses,
 * minus the camera.
 *
 * Scroll mechanic: the page performs the product's mode switch. A pinned
 * section swaps TERMINAL for DIRAC-DELTA — the words cross-fade, the lattice
 * contracts, and a holographic grid resolves underneath. Everything past that
 * point is in workspace mode.
 */

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';

import LatticeCore from '../three/LatticeCore';
import Marquee from '../components/Marquee';
import Glance from '../components/Glance';
import Download from '../components/Download';
import NextUp from '../components/NextUp';
import { Overview, Features, Specs, ThankYou, Footer } from '../components/Sections';
import { DOSSIERS } from '../lib/dossiers';
import { useIso, useLineReveal, useFitToWidth } from '../lib/motion';

import '../styles/dossier.css';

const D = DOSSIERS.epsilon;

export default function AgentEpsilon() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const switchRef = useRef(null);
  const chapterLineRef = useRef(null);
  const modeRef = useRef(0);
  const readoutRef = useRef(null);

  useLineReveal(chapterLineRef, { stagger: 0.1, start: 'top 74%' });
  // Solve the title's size against the real column width — a vw guess
  // renders wider in Safari than in Chrome and breaks the word mid-line.
  useFitToWidth(pageRef, '.dhero__title', { max: 260 });

  useIso(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dhero__eyebrow', { opacity: 0, y: 18, duration: 1, delay: 0.3, ease: 'expo.out' });
      gsap.from('.dhero__title', { opacity: 0, y: 60, duration: 1.4, delay: 0.4, ease: 'expo.out' });
      gsap.from('.dhero__tag', { opacity: 0, y: 24, duration: 1.1, delay: 0.65, ease: 'expo.out' });
      gsap.from('.dhero__foot', { opacity: 0, duration: 1, delay: 0.95 });

      gsap.to('.dhero__body', {
        yPercent: -12,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true,
        },
      });

      /* The mode switch. A pinned hold where the application changes what it
         is, and the scene changes with it. */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: switchRef.current,
          start: 'top top',
          end: '+=1500',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Ease the mode value so the 3D transition lags the type slightly.
            modeRef.current = gsap.parseEase('power2.inOut')(self.progress);
            if (readoutRef.current) {
              readoutRef.current.textContent =
                self.progress < 0.5 ? 'TERMINAL' : 'DIRAC-DELTA';
            }
          },
        },
      });

      tl.to('.modeswitch__from', {
        opacity: 0, yPercent: -26, filter: 'blur(10px)', duration: 0.45, ease: 'power2.in',
      }, 0.18)
        .fromTo('.modeswitch__to',
          { opacity: 0, yPercent: 30, filter: 'blur(12px)' },
          { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' },
          0.42)
        .to('.modeswitch__sub', { opacity: 0, duration: 0.2 }, 0.18)
        .to('.modeswitch__sub2', { opacity: 1, duration: 0.3 }, 0.6);
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="page" data-dossier="epsilon" ref={pageRef}>
      <div className="canvas-fixed">
        <Canvas camera={{ position: [0, 0, 8.5], fov: 44 }} dpr={[1, 1.6]}>
          <LatticeCore modeRef={modeRef} />
        </Canvas>
      </div>

      <section className="dhero" ref={heroRef}>
        <div className="dhero__body">
          <div className="dhero__eyebrow">
            <span>{D.index}</span><span>/</span><b>{D.classification}</b>
          </div>
          <h1 className="dhero__title">Agent<br />Epsilon</h1>
          <p className="dhero__tag">
            Your cursor is the hand. Move it — the lattice knows how close you are.
          </p>
        </div>

        <div className="dhero__foot">
          <span className="hint">
            <span className="hint__line" />
            Scroll to switch modes
          </span>
          <span>v45.1.0 · dual-mode</span>
        </div>
      </section>

      <div className="readout">
        <span>Mode · <b ref={readoutRef}>TERMINAL</b></span>
        <span>Voice · <b>STT + TTS</b></span>
        <span>Agents · <b>MULTI</b></span>
        <span>Memory · <b>PERSISTENT</b></span>
      </div>

      <Overview n="01" tagline={D.tagline} lede={D.lede} />

      <section className="chapter">
        <p className="chapter__line" ref={chapterLineRef}>
          You talk to it until talking stops being the right interface. Then you
          reach in.
        </p>
      </section>

      {/* ── The mode switch ── */}
      <section className="modeswitch" ref={switchRef}>
        <div className="modeswitch__stack">
          <div className="modeswitch__label modeswitch__from">Terminal</div>
          <div className="modeswitch__label modeswitch__to">Dirac-Delta</div>
          <p className="modeswitch__sub">Voice in · reasoning · voice out</p>
          <p
            className="modeswitch__sub modeswitch__sub2"
            style={{ opacity: 0, position: 'absolute', left: 0, right: 0 }}
          >
            Hands in · geometry · export out
          </p>
        </div>
      </section>

      <Features n="02" items={D.features} />

      <Glance
        n="03"
        dossier={D}
        caption="Left: the voice lattice reacting to amplitude, with the tracked hand points orbiting it."
      />

      <Marquee
        items={['Listen', '·', 'Reason', '·', 'Speak', '·', 'Reach', '·', 'Build', '·']}
        speed={0.5}
        direction={-1}
      />

      <Specs
        n="04"
        rows={D.specs}
        note="Camera and microphone are requested only for the modes that use them."
      />

      <Download n="05" dossier={D} />

      <ThankYou
        line="Thank you for making it through both modes. One of them talks back and one of them lets you reach in — they are the same application, and that was the hard part."
        sub="Agent Epsilon · 03 of 04"
      />

      <NextUp from="epsilon" />
      <Footer note="Dossier 03 — Epsilon" />
    </div>
  );
}
