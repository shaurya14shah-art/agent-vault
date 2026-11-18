/**
 * SIGNAL
 *
 * A live, procedural signature for each product — no screenshots, no stock
 * imagery. Every variant is drawn from something the product actually does,
 * so it reads as a portrait of the software rather than decoration:
 *
 *   cipher    — a plaintext grid sealing into ciphertext, block by block
 *   eminence  — nine model forecasts fanning out from one price path
 *   epsilon   — a voice lattice pulsing, with tracked hand points around it
 *   fracture  — a noise-generated terrain resolving chunk by chunk
 *
 * All four are SVG on a requestAnimationFrame, cheap enough to run several
 * at once.
 */

import { useEffect, useState } from 'react';

/* ── Cipher: sealing grid ─────────────────────────────────── */

const HEX = '0123456789ABCDEF';

function CipherSignal({ accent, live }) {
  const [cells, setCells] = useState(() =>
    Array.from({ length: 96 }, () => ({ sealed: false, c: '·' }))
  );

  useEffect(() => {
    if (!live) return;
    let raf, tick = 0;
    const loop = () => {
      tick++;
      if (tick % 4 === 0) {
        setCells((prev) => {
          const next = [...prev];
          // Seal a few random cells each pass; once the grid is full, reset.
          const openIdx = next.map((c, i) => (c.sealed ? -1 : i)).filter((i) => i >= 0);
          if (!openIdx.length) return prev.map(() => ({ sealed: false, c: '·' }));
          for (let k = 0; k < 3 && openIdx.length; k++) {
            const i = openIdx.splice(Math.floor(Math.random() * openIdx.length), 1)[0];
            next[i] = {
              sealed: true,
              c: HEX[Math.floor(Math.random() * 16)] + HEX[Math.floor(Math.random() * 16)],
            };
          }
          return next;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 3,
        fontFamily: 'var(--mono)',
        fontSize: 9,
        lineHeight: 1,
        width: '100%',
        height: '100%',
        alignContent: 'center',
        padding: 12,
      }}
    >
      {cells.map((c, i) => (
        <span
          key={i}
          style={{
            textAlign: 'center',
            padding: '3px 0',
            color: c.sealed ? accent : 'rgba(237,234,227,0.2)',
            background: c.sealed ? `${accent}14` : 'transparent',
            transition: 'color 0.4s, background 0.4s',
          }}
        >
          {c.sealed ? c.c : '··'}
        </span>
      ))}
    </div>
  );
}

/* ── Eminence: ensemble fan ───────────────────────────────── */

function EminenceSignal({ accent, live }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!live) return;
    let raf;
    const loop = () => { setT((v) => v + 0.012); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  const W = 300, H = 170, split = 150;

  // One shared history, then nine divergent forecasts.
  const history = [];
  for (let x = 0; x <= split; x += 4) {
    const y =
      H / 2 +
      Math.sin(x * 0.05 + t) * 16 +
      Math.sin(x * 0.017 + t * 0.6) * 22 +
      Math.sin(x * 0.11) * 5;
    history.push([x, y]);
  }
  const anchor = history[history.length - 1];

  const forecasts = Array.from({ length: 9 }, (_, m) => {
    const pts = [anchor];
    const drift = (m - 4) * 0.14;
    const wobble = 0.6 + m * 0.13;
    for (let x = split + 4; x <= W; x += 5) {
      const d = x - split;
      pts.push([
        x,
        anchor[1] + drift * d + Math.sin(d * 0.06 * wobble + t * 2 + m) * (d * 0.06),
      ]);
    }
    return pts;
  });

  const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" y1={H * f} x2={W} y2={H * f}
          stroke="rgba(237,234,227,0.07)" strokeWidth="1" />
      ))}
      <line x1={split} y1="0" x2={split} y2={H} stroke={accent} strokeWidth="1" opacity="0.35" strokeDasharray="2 4" />

      {forecasts.map((pts, i) => (
        <path key={i} d={path(pts)} fill="none" stroke={accent}
          strokeWidth="1"
          // Weight = the meta-learner's confidence. Middle models lead.
          opacity={0.12 + (1 - Math.abs(i - 4) / 5) * 0.5} />
      ))}

      <path d={path(history)} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx={anchor[0]} cy={anchor[1]} r="2.6" fill={accent} />
    </svg>
  );
}

/* ── Epsilon: voice lattice + tracked hand ────────────────── */

function EpsilonSignal({ accent, live }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!live) return;
    let raf;
    const loop = () => { setT((v) => v + 0.02); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  const W = 300, H = 170, cx = W / 2, cy = H / 2;
  const amp = 0.45 + Math.sin(t * 1.7) * 0.3 + Math.sin(t * 4.3) * 0.14;

  const rings = [0, 1, 2, 3].map((i) => {
    const r = 20 + i * 15 + amp * (8 + i * 7);
    const pts = Array.from({ length: 44 }, (_, k) => {
      const a = (k / 44) * Math.PI * 2;
      const wob = Math.sin(a * (3 + i) + t * (1.4 + i * 0.5)) * amp * 6;
      return [cx + Math.cos(a) * (r + wob), cy + Math.sin(a) * (r + wob) * 0.82];
    });
    return { pts, o: 0.5 - i * 0.1 };
  });

  // Five fingertips orbiting — the hand-tracking layer.
  const hand = Array.from({ length: 5 }, (_, i) => {
    const a = t * 0.5 + i * 0.42 - 0.9;
    const r = 62 + Math.sin(t * 1.1 + i) * 9;
    return [cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.7];
  });

  const poly = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {rings.map((r, i) => (
        <polygon key={i} points={poly(r.pts)} fill="none" stroke={accent}
          strokeWidth="1" opacity={r.o} />
      ))}
      <circle cx={cx} cy={cy} r={4 + amp * 5} fill={accent} opacity="0.9" />

      {hand.map(([x, y], i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={x} y2={y}
            stroke="var(--ink)" strokeWidth="0.5" opacity="0.14" />
          <rect x={x - 2.5} y={y - 2.5} width="5" height="5"
            fill="none" stroke="var(--ink)" strokeWidth="1" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

/* ── Fracture: terrain resolving ──────────────────────────── */

function FractureSignal({ accent, live }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!live) return;
    let raf;
    const loop = () => { setT((v) => v + 0.006); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  const W = 300, H = 170, ROWS = 15, COLS = 22;

  // Cheap layered sine "noise" standing in for the real terrain generator.
  const height = (x, z) =>
    Math.sin(x * 0.5 + z * 0.3 + t) * 1 +
    Math.sin(x * 0.21 - z * 0.44 + t * 0.6) * 1.6 +
    Math.sin(x * 0.9 + t * 1.4) * 0.35;

  const rows = Array.from({ length: ROWS }, (_, r) => {
    const depth = r / (ROWS - 1);
    const y0 = 34 + depth * (H - 52);
    const spread = 0.28 + depth * 0.72;
    const pts = Array.from({ length: COLS }, (_, c) => {
      const nx = (c / (COLS - 1) - 0.5) * 2;
      const x = W / 2 + nx * (W / 2) * spread;
      const y = y0 - height(c, r) * (5 + depth * 12);
      return [x, y];
    });
    return { pts, depth };
  });

  const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {rows.map((r, i) => (
        <path key={i} d={path(r.pts)} fill="none"
          stroke={i % 4 === 0 ? accent : 'var(--ink)'}
          strokeWidth={0.6 + r.depth * 1.1}
          // Far rows are still "unresolved" — chunks fading in at the horizon.
          opacity={0.06 + r.depth * 0.55} />
      ))}
      <circle cx={W / 2} cy={H - 22} r="3" fill={accent} />
      <circle cx={W / 2} cy={H - 22} r={7 + Math.sin(t * 6) * 2.5}
        fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/* ── Router ───────────────────────────────────────────────── */

const VARIANTS = {
  cipher: CipherSignal,
  eminence: EminenceSignal,
  epsilon: EpsilonSignal,
  fracture: FractureSignal,
};

export default function Signal({ id, accent, live = true, className = '', style }) {
  const Variant = VARIANTS[id] ?? CipherSignal;
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
      aria-hidden="true"
    >
      <Variant accent={accent} live={live} />
      {/* Scanline veil — ties the four variants into one visual family. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, transparent 1px 3px)',
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  );
}

/** Pauses when off-screen — four live rAF loops shouldn't run unseen. */
export function useInView(ref, margin = '120px') {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return inView;
}
