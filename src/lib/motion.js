/**
 * MOTION CORE
 *
 * The whole site's feel comes from four ideas:
 *   1. Lenis owns scroll; ScrollTrigger reads from it. Never two smoothers.
 *   2. Reveals are line-masked — text slides out from under its own sleeve.
 *   3. Scroll *velocity* is a first-class input, not just position.
 *   4. Nothing snaps. Everything is damped toward a target every frame.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* SSR-safe layout effect (this app is client-only, but keeps React quiet). */
export const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* ── Math ──────────────────────────────────────────────────── */

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
export const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);

/**
 * Frame-rate independent damping. The naive `lerp(cur, target, 0.1)` runs
 * twice as fast on a 120Hz display; this doesn't.
 */
export const damp = (cur, target, smoothing, dt) =>
  lerp(cur, target, 1 - Math.pow(smoothing, dt));

/* ── Shared pointer state ──────────────────────────────────────
   One listener for the entire app. Every consumer reads the same object
   instead of attaching its own mousemove. */

export const pointer = {
  x: 0, y: 0,           // px
  nx: 0, ny: 0,         // normalised −1..1
  vx: 0, vy: 0,         // velocity px/frame
  speed: 0,
  down: false,
  moved: false,
};

let pointerBound = false;

export function bindPointer() {
  if (pointerBound || typeof window === 'undefined') return;
  pointerBound = true;

  let px = window.innerWidth / 2;
  let py = window.innerHeight / 2;
  pointer.x = px;
  pointer.y = py;

  const onMove = (e) => {
    pointer.vx = e.clientX - px;
    pointer.vy = e.clientY - py;
    pointer.speed = Math.hypot(pointer.vx, pointer.vy);
    px = pointer.x = e.clientX;
    py = pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.moved = true;
  };

  const onDown = () => { pointer.down = true; };
  const onUp = () => { pointer.down = false; };

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });

  // Velocity decays when the pointer stops, so consumers relax back to rest.
  gsap.ticker.add(() => {
    pointer.vx *= 0.86;
    pointer.vy *= 0.86;
    pointer.speed *= 0.86;
  });
}

/* ── Scroll velocity ──────────────────────────────────────────
   Normalised −1..1, damped. Drives skew, chromatic split, 3D turbulence. */

export const scrollState = { velocity: 0, raw: 0, progress: 0, direction: 1 };

let velocityBound = false;

export function bindScrollVelocity() {
  if (velocityBound) return;
  velocityBound = true;

  ScrollTrigger.create({
    onUpdate: (self) => {
      scrollState.raw = self.getVelocity();
      scrollState.direction = self.direction;
    },
  });

  gsap.ticker.add(() => {
    const target = clamp(scrollState.raw / 2400, -1, 1);
    scrollState.velocity = lerp(scrollState.velocity, target, 0.12);
    // Decay the raw reading so a stopped scroll returns to zero.
    scrollState.raw *= 0.9;
  });
}

/* ── Text splitting ──────────────────────────────────────────
   No SplitText plugin (that's GSAP premium). This does lines-by-wrapping
   and chars, and keeps the source text in an aria-label so the DOM churn
   never costs us screen-reader output. */

export function splitChars(el) {
  if (!el) return [];
  // Idempotent: StrictMode mounts twice, and a second split would wipe the
  // spans the first one made. Hand back what's already there.
  if (el.dataset.split === 'chars') {
    return Array.from(el.querySelectorAll('.ch'));
  }
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.dataset.split = 'chars';
  el.textContent = '';

  const chars = [];
  for (const c of text) {
    const span = document.createElement('span');
    span.className = 'ch';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = c === ' ' ? ' ' : c;
    el.appendChild(span);
    if (c !== ' ') chars.push(span);
  }
  return chars;
}

/**
 * Wrap each word in a sleeve so we can mask lines. Words are grouped into
 * lines by measuring offsetTop after layout — which means this must run
 * after fonts settle, hence the useIso callers.
 */
export function splitLines(el) {
  if (!el || el.dataset.split === 'lines') {
    return Array.from(el?.querySelectorAll('.rv__i') || []);
  }
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.dataset.split = 'lines';
  el.textContent = '';

  // Stage 1: every word becomes an inline span we can measure.
  const words = text.split(/\s+/).map((w) => {
    const s = document.createElement('span');
    s.style.display = 'inline-block';
    s.textContent = w;
    el.appendChild(s);
    el.appendChild(document.createTextNode(' '));
    return s;
  });

  // Stage 2: group by vertical position.
  const lines = [];
  let currentTop = null;
  let bucket = [];
  words.forEach((w) => {
    const top = w.offsetTop;
    if (currentTop === null) currentTop = top;
    if (Math.abs(top - currentTop) > 2) {
      lines.push(bucket);
      bucket = [];
      currentTop = top;
    }
    bucket.push(w.textContent);
  });
  if (bucket.length) lines.push(bucket);

  // Stage 3: rebuild as masked sleeves.
  el.textContent = '';
  const inners = [];
  lines.forEach((wordsInLine) => {
    const sleeve = document.createElement('span');
    sleeve.className = 'rv';
    sleeve.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'rv__i';
    inner.textContent = wordsInLine.join(' ');
    sleeve.appendChild(inner);
    el.appendChild(sleeve);
    inners.push(inner);
  });
  return inners;
}

/* ── Reveal hooks ────────────────────────────────────────────── */

/**
 * Line-masked reveal. The signature move of the site: lines rise out from
 * under their own clip with a slight rotation, staggered.
 */
export function useLineReveal(ref, opts = {}) {
  const {
    start = 'top 88%',
    stagger = 0.09,
    duration = 1.15,
    y = '110%',
    rotate = 4,
    delay = 0,
    once = true,
  } = opts;

  useIso(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const inners = splitLines(el);
      if (!inners.length) return;

      gsap.set(inners, { yPercent: parseFloat(y), rotate });
      gsap.to(inners, {
        yPercent: 0,
        rotate: 0,
        duration,
        delay,
        stagger,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start, once },
      });
    }, el);

    return () => ctx.revert();
  }, []);
}

/** Character cascade — for short display words only. */
export function useCharReveal(ref, opts = {}) {
  const { start = 'top 90%', stagger = 0.028, duration = 1.0, delay = 0 } = opts;

  useIso(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const chars = splitChars(el);
      if (!chars.length) return;

      gsap.set(chars, { yPercent: 118, opacity: 0 });
      gsap.to(chars, {
        yPercent: 0,
        opacity: 1,
        duration,
        delay,
        stagger: { each: stagger, from: 'start' },
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);
}

/** Generic fade-and-rise for blocks that aren't text. */
export function useRise(ref, opts = {}) {
  const { start = 'top 90%', y = 44, duration = 1.1, stagger = 0.08, selector = null } = opts;

  useIso(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const targets = selector ? gsap.utils.toArray(selector, el) : [el];
      if (!targets.length) return;

      gsap.from(targets, {
        y,
        opacity: 0,
        duration,
        stagger,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);
}

/* ── Magnetic attraction ──────────────────────────────────────
   The element leans toward the cursor within a radius, its label leaning
   further — parallax inside a button. */

export function useMagnetic(ref, { strength = 0.38, radius = 130, inner = 0.62 } = {}) {
  useIso(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const innerEl = el.querySelector('.mag__inner');
    const setX = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
    const setY = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
    const setIX = innerEl ? gsap.quickTo(innerEl, 'x', { duration: 0.9, ease: 'power3.out' }) : null;
    const setIY = innerEl ? gsap.quickTo(innerEl, 'y', { duration: 0.9, ease: 'power3.out' }) : null;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = radius + Math.max(r.width, r.height) / 2;

      if (dist < reach) {
        // Falls off with distance so the pull feels like a field, not a snap.
        const falloff = 1 - dist / reach;
        setX(dx * strength * falloff);
        setY(dy * strength * falloff);
        setIX?.(dx * strength * inner * falloff);
        setIY?.(dy * strength * inner * falloff);
      } else {
        setX(0); setY(0); setIX?.(0); setIY?.(0);
      }
    };

    const onLeave = () => { setX(0); setY(0); setIX?.(0); setIY?.(0); };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [strength, radius, inner]);
}

/* ── Velocity skew ────────────────────────────────────────────
   Content leans into the direction of travel and settles. Subtle enough
   that you feel it before you notice it. */

export function useVelocitySkew(ref, { max = 5, selector = null } = {}) {
  useIso(() => {
    const el = ref.current;
    if (!el) return;

    const targets = selector ? gsap.utils.toArray(selector, el) : [el];
    if (!targets.length) return;

    const setters = targets.map((t) => gsap.quickSetter(t, 'skewY', 'deg'));
    const tick = () => {
      const skew = clamp(scrollState.velocity * max, -max, max);
      setters.forEach((s) => s(skew));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [max]);
}

/* ── Parallax ──────────────────────────────────────────────── */

export function useParallax(ref, { speed = 0.2, selector = null } = {}) {
  useIso(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const targets = selector ? gsap.utils.toArray(selector, el) : [el];
      targets.forEach((t) => {
        const s = parseFloat(t.dataset.speed ?? speed);
        gsap.to(t, {
          yPercent: -s * 100,
          ease: 'none',
          scrollTrigger: {
            trigger: t.closest('section') || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [speed]);
}

/* ── Scramble ────────────────────────────────────────────────
   Decode-on-reveal. Used sparingly — it's a spice, not a base note. */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#*+=—';

export function scramble(el, target, { onDone } = {}) {
  if (!el) return () => {};
  const queue = [...target].map((to, i) => ({
    to,
    start: Math.floor(Math.random() * 22) + i * 1.4,
    end: Math.floor(Math.random() * 26) + i * 1.4 + 16,
    char: null,
  }));

  let frame = 0;
  let raf;
  const step = () => {
    let out = '';
    let done = 0;
    for (const q of queue) {
      if (frame >= q.end) { done++; out += q.to; }
      else if (frame >= q.start) {
        if (!q.char || Math.random() < 0.3) {
          q.char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        out += q.char;
      } else out += ' ';
    }
    el.textContent = out;
    if (done === queue.length) { onDone?.(); return; }
    frame++;
    raf = requestAnimationFrame(step);
  };
  step();
  return () => cancelAnimationFrame(raf);
}

/** Decodes once when scrolled into view. */
export function useScramble(ref, text, { start = 'top 88%' } = {}) {
  useIso(() => {
    const el = ref.current;
    if (!el) return;
    let cancel = () => {};
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => { cancel = scramble(el, text); },
    });
    return () => { cancel(); st.kill(); };
  }, [text]);
}

/* ── Fit-to-width display type ────────────────────────────────
   A `font-size: clamp(…, 13.5vw, …)` wordmark only *looks* like it fits.
   Whether it actually does depends on the font's advance widths, and those
   differ between engines — Safari renders Helvetica Neue a shade wider than
   Chrome, which is enough to push a five-letter word past its column.

   Worse, splitChars() turns every letter into an inline-block, and line
   breaks are permitted between inline-block boxes: instead of overflowing
   visibly, the word silently breaks mid-word ("AGEN / T").

   So measure the real rendered width and solve for the font size. Pair with
   `white-space: nowrap` on the element so a break is impossible either way. */

export function fitToWidth(el, { min = 24, max = 260, fill = 1, shrinkOnly = true } = {}) {
  if (!el?.parentElement) return;

  const parent = el.parentElement;
  const cs = getComputedStyle(parent);
  const avail =
    parent.clientWidth -
    parseFloat(cs.paddingLeft || 0) -
    parseFloat(cs.paddingRight || 0);
  if (avail <= 0) return;

  const prevDisplay = el.style.display;

  // Drop any size this function set previously so the stylesheet's clamp()
  // is visible again. Without this, repeated runs would measure their own
  // last answer and ratchet the type smaller on every resize.
  el.style.fontSize = '';
  const cssSize = parseFloat(getComputedStyle(el).fontSize) || max;

  // Measure at a known size with the element shrink-wrapped: a block
  // element's scrollWidth reports the column width, not the text width.
  const PROBE = 200;
  el.style.fontSize = `${PROBE}px`;
  el.style.display = 'inline-block';
  const natural = el.getBoundingClientRect().width;
  el.style.display = prevDisplay;

  if (!natural) {
    el.style.fontSize = '';
    return;
  }

  let size = (PROBE * avail * fill) / natural;

  // Only ever shrink. The clamp() in the stylesheet is the intended design;
  // this is a safety net for engines whose metrics run wider (Safari renders
  // Helvetica Neue wider than Chrome), not a licence to restyle the page.
  if (shrinkOnly) size = Math.min(size, cssSize);
  size = clamp(size, min, max);

  // Leave the stylesheet in charge when it already fits.
  el.style.fontSize = size >= cssSize - 0.5 ? '' : `${size}px`;
}

/** Fit every match, and re-fit on resize. */
export function useFitToWidth(ref, selector, opts = {}) {
  useIso(() => {
    const root = ref.current;
    if (!root) return;

    const run = () => {
      root.querySelectorAll(selector).forEach((el) => fitToWidth(el, opts));
      ScrollTrigger.refresh();
    };

    run();
    // Some titles (DecryptField, TorchTitle) build their characters in a
    // passive effect, so at layout time there is nothing to measure yet.
    const raf = requestAnimationFrame(run);
    // Fonts can settle after first paint and change every advance width.
    document.fonts?.ready?.then(run).catch(() => {});

    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(run, 120); };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [selector]);
}

/* ── Viewport ────────────────────────────────────────────────── */

export function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window === 'undefined' ? 1280 : window.innerWidth,
    h: typeof window === 'undefined' ? 800 : window.innerHeight,
    mobile: typeof window === 'undefined' ? false : window.innerWidth < 860,
  }));

  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        setVp({ w: window.innerWidth, h: window.innerHeight, mobile: window.innerWidth < 860 });
        ScrollTrigger.refresh();
      }, 180);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);

  return vp;
}

/** Respect the OS setting — and let 3D scenes downgrade themselves. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export { gsap, ScrollTrigger };
export const useRefEl = () => useRef(null);
