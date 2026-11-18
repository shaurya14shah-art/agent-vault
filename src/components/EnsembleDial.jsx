/**
 * ENSEMBLE DIAL — Agent Eminence's landing interaction
 *
 * The cursor's horizontal position is the market regime. Move left and the
 * ensemble is in a ranging market; move right and it's trending; the middle
 * is volatile. The nine model weights redistribute live, exactly the way the
 * Bayesian meta-learner reweights them when the regime layer changes its
 * mind — mean-reversion models earn their vote in a range and lose it in a
 * trend.
 *
 * The weights are illustrative of the mechanism, not a live market read.
 */

import { useEffect, useRef, useState } from 'react';
import { pointer, damp, clamp } from '../lib/motion';
import { gsap } from '../lib/motion';

/* Each model's affinity across the regime axis (0 = ranging → 1 = trending).
   `peak` is where it does its best work, `width` how tolerant it is. */
const MODELS = [
  { k: 'GARCH(1,1)',        d: 'Volatility clustering',    peak: 0.5,  width: 0.30 },
  { k: 'Ornstein–Uhlenbeck', d: 'Mean reversion',          peak: 0.06, width: 0.26 },
  { k: 'Merton jump',        d: 'Gaps and shocks',         peak: 0.46, width: 0.20 },
  { k: 'Kalman filter',      d: 'State smoothing',         peak: 0.62, width: 0.38 },
  { k: 'ARIMA',              d: 'Trend extrapolation',     peak: 0.92, width: 0.30 },
  { k: 'Wavelet',            d: 'Multi-scale denoising',   peak: 0.40, width: 0.42 },
  { k: 'Fourier harmonics',  d: 'Cyclical structure',      peak: 0.18, width: 0.28 },
  { k: 'Regime HMM',         d: 'Bull / bear state',       peak: 0.72, width: 0.44 },
  { k: 'Black–Scholes',      d: 'Option-implied bounds',   peak: 0.5,  width: 0.50 },
];

const REGIMES = [
  { at: 0.0,  name: 'Ranging' },
  { at: 0.5,  name: 'Volatile' },
  { at: 1.0,  name: 'Trending' },
];

function regimeName(r) {
  return REGIMES.reduce((best, cur) =>
    Math.abs(cur.at - r) < Math.abs(best.at - r) ? cur : best
  ).name;
}

export default function EnsembleDial({ accent = '#e5b451' }) {
  const rootRef = useRef(null);
  const barsRef = useRef([]);
  const valsRef = useRef([]);
  const [regime, setRegime] = useState('Volatile');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Smoothed regime value so the bars glide rather than jitter.
    let r = 0.5;
    let last = performance.now();
    let raf;

    const weights = new Array(MODELS.length).fill(1 / MODELS.length);

    const tick = () => {
      const now = performance.now();
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;

      const rect = root.getBoundingClientRect();
      // Only track while the pointer is anywhere near the panel's band.
      const target = clamp((pointer.x - rect.left) / Math.max(rect.width, 1), 0, 1);
      r = damp(r, target, 0.004, dt);

      // Gaussian affinity, then normalise — the same shape as an exponential
      // weight update settling on the models that fit the current state.
      let sum = 0;
      const raw = MODELS.map((m) => {
        const d = (r - m.peak) / m.width;
        const w = Math.exp(-0.5 * d * d);
        sum += w;
        return w;
      });

      for (let i = 0; i < MODELS.length; i++) {
        weights[i] = damp(weights[i], raw[i] / sum, 0.002, dt);
        const pct = weights[i] * 100;
        const bar = barsRef.current[i];
        const val = valsRef.current[i];
        if (bar) bar.style.transform = `scaleX(${clamp(pct / 24, 0.02, 1)})`;
        if (val) val.textContent = pct.toFixed(1).padStart(4, '0');
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    // The label only needs to change when the bucket changes.
    const nameTimer = setInterval(() => setRegime(regimeName(r)), 220);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(nameTimer);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dial__row', {
        opacity: 0,
        x: -18,
        duration: 0.9,
        delay: 0.5,
        stagger: 0.045,
        ease: 'expo.out',
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="dial" ref={rootRef} data-cursor="drag" data-cursor-label="Regime">
      <div className="dial__head">
        <span className="t-mono">Ensemble weights · live</span>
        <span className="t-mono t-mono--accent">Regime — {regime}</span>
      </div>

      {MODELS.map((m, i) => (
        <div className="dial__row" key={m.k}>
          <span className="dial__k">{m.k}</span>
          <span className="dial__track">
            <span
              className="dial__bar"
              ref={(el) => { barsRef.current[i] = el; }}
              style={{ background: accent }}
            />
          </span>
          <span className="dial__v" ref={(el) => { valsRef.current[i] = el; }}>
            11.1
          </span>
          <span className="dial__d">{m.d}</span>
        </div>
      ))}

      <p className="dial__foot t-mono">
        Move left → ranging · right → trending. Illustrates the reweighting
        mechanism, not a live market feed.
      </p>
    </div>
  );
}
