/**
 * AGENT EMINENCE — 02
 *
 * Landing interaction: the cursor is the market regime. Sweep it across the
 * hero and the nine model weights redistribute live.
 *
 * Scroll mechanic: two things, both tied to the product's thesis.
 *   1. Page progress drives `converge` — the volatility surface behind
 *      everything starts loud and disordered and resolves into a clean trend
 *      surface as you descend. Scrolling *is* the ensemble converging.
 *   2. The nine models sit on a pinned horizontal rail: vertical input,
 *      sideways travel. The section listing the ensemble is the one section
 *      that moves along a different axis.
 */

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';

import VolatilitySurface from '../three/VolatilitySurface';
import EnsembleDial from '../components/EnsembleDial';
import Marquee from '../components/Marquee';
import Glance from '../components/Glance';
import Download from '../components/Download';
import NextUp from '../components/NextUp';
import { Overview, Features, Specs, ThankYou, Footer, Marker } from '../components/Sections';
import { DOSSIERS } from '../lib/dossiers';
import { useIso, useLineReveal, useFitToWidth, ScrollTrigger } from '../lib/motion';

import '../styles/dossier.css';

const D = DOSSIERS.eminence;

/* The nine, in the order quant_brain.py declares them. */
const MODELS = [
  ['01', 'GARCH(1,1)', 'σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁ — volatility clusters, so big moves beget big moves.'],
  ['02', 'Ornstein–Uhlenbeck', 'A mean-reverting SDE. Pulls the forecast back toward the long-run level.'],
  ['03', 'Merton jump diffusion', 'Geometric Brownian motion plus Poisson jumps, for the gaps GBM alone refuses to admit exist.'],
  ['04', 'Kalman filter', 'State-space smoothing. Separates the signal from the measurement noise around it.'],
  ['05', 'ARIMA', 'Classical trend extrapolation — the baseline the others have to beat.'],
  ['06', 'Wavelet decomposition', 'Denoising across several scales at once rather than one fixed window.'],
  ['07', 'Fourier harmonics', 'Pulls cyclical structure out of the frequency domain.'],
  ['08', 'Regime detection', 'A hidden Markov layer calling bull or bear before the ensemble speaks.'],
  ['09', 'Black–Scholes', 'Option-implied boundaries — what the market itself is already pricing in.'],
];

export default function AgentEminence() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const railRef = useRef(null);
  const trackRef = useRef(null);
  const chapterLineRef = useRef(null);
  const convergeRef = useRef(0);
  const readoutRef = useRef(null);

  useLineReveal(chapterLineRef, { stagger: 0.1, start: 'top 74%' });
  // Solve the title's size against the real column width — a vw guess
  // renders wider in Safari than in Chrome and breaks the word mid-line.
  useFitToWidth(pageRef, '.dhero__title', { max: 260 });

  useIso(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dhero__eyebrow', { opacity: 0, y: 18, duration: 1, delay: 0.3, ease: 'expo.out' });
      gsap.from('.dhero__title', { opacity: 0, y: 60, duration: 1.4, delay: 0.4, ease: 'expo.out' });
      gsap.from('.dial', { opacity: 0, y: 30, duration: 1.2, delay: 0.6, ease: 'expo.out' });
      gsap.from('.dhero__foot', { opacity: 0, duration: 1, delay: 0.95 });

      /* Convergence, read by the surface and the readout strip. */
      ScrollTrigger.create({
        trigger: pageRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          convergeRef.current = self.progress;
          if (readoutRef.current) {
            readoutRef.current.textContent =
              self.progress > 0.97
                ? 'CONVERGED'
                : `CONVERGING ${String(Math.round(self.progress * 100)).padStart(2, '0')}%`;
          }
        },
      });

      gsap.to('.dhero__body', {
        yPercent: -12,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true,
        },
      });

      /* Horizontal rail. Vertical input, sideways travel. */
      const track = trackRef.current;
      if (track) {
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: railRef.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="page" data-dossier="eminence" ref={pageRef}>
      {/* Surface layer sits outside every pinned subtree — a WebGL canvas
          inside a pinned element gets re-parented mid-measure and never
          finishes initialising. */}
      <div className="canvas-fixed">
        <Canvas camera={{ position: [0, 4.6, 13], fov: 46 }} dpr={[1, 1.6]}>
          <VolatilitySurface convergeRef={convergeRef} />
        </Canvas>
      </div>

      <section className="dhero" ref={heroRef}>
        <div className="dhero__body">
          <div className="dhero__eyebrow">
            <span>{D.index}</span><span>/</span><b>{D.classification}</b>
          </div>
          <h1 className="dhero__title">Agent<br />Eminence</h1>
          <div style={{ marginTop: 'var(--s-6)' }}>
            <EnsembleDial accent={D.accent} />
          </div>
        </div>

        <div className="dhero__foot">
          <span className="hint">
            <span className="hint__line" />
            Scroll — the surface converges
          </span>
          <span>Nine models · one referee</span>
        </div>
      </section>

      <div className="readout">
        <span>Ensemble · <b ref={readoutRef}>CONVERGING 00%</b></span>
        <span>Models · <b>9 parallel</b></span>
        <span>Meta-learner · <b>Bayesian</b></span>
        <span>Execution · <b>LOCAL</b></span>
      </div>

      <Overview n="01" tagline={D.tagline} lede={D.lede} />

      <section className="chapter">
        <p className="chapter__line" ref={chapterLineRef}>
          One model is a hypothesis. Nine models kept honest by their own track
          record is a method.
        </p>
      </section>

      {/* ── The rail ── */}
      <section className="rail" ref={railRef}>
        <div className="shell" style={{ paddingTop: 'var(--s-8)' }}>
          <Marker n="02" title="The Ensemble" right="Scroll sideways" />
        </div>
        <div className="rail__track" ref={trackRef}>
          {MODELS.map(([n, name, body]) => (
            <article className="rail__card" key={n} data-cursor="hover">
              <span className="rail__n">{n} / 09</span>
              <div>
                <h3 className="rail__h">{name}</h3>
                <p className="rail__b">{body}</p>
              </div>
            </article>
          ))}
          <article className="rail__card" style={{ borderColor: D.accent }}>
            <span className="rail__n">Meta</span>
            <div>
              <h3 className="rail__h">The referee</h3>
              <p className="rail__b">
                After every cycle each model is scored on realised error and its
                weight updated exponentially. Models that keep missing quietly
                lose their vote — and nobody has to retune anything by hand.
              </p>
            </div>
          </article>
        </div>
      </section>

      <Features n="03" items={D.features} />

      <Glance
        n="04"
        dossier={D}
        caption="Left: one shared price history, nine forecasts fanning out from it. Line weight is the meta-learner's confidence."
      />

      <Marquee
        items={['GARCH', '·', 'Kalman', '·', 'ARIMA', '·', 'HMM', '·', 'Wavelet', '·']}
        speed={0.5}
      />

      <Specs
        n="05"
        rows={D.specs}
        note="Runs entirely on your own machine. Brain state persists to local disk."
      />

      <Download n="06" dossier={D} />

      <ThankYou
        line="Thank you for reading past the first model. Most forecasting tools ask you to trust one; this one runs nine and keeps score."
        sub="Agent Eminence · 02 of 04"
      />

      <NextUp from="eminence" />
      <Footer note="Dossier 02 — Eminence" />
    </div>
  );
}
