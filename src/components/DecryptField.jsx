/**
 * DECRYPT FIELD
 *
 * Agent Cipher's landing interaction. The headline renders as ciphertext;
 * your cursor is the key. Characters within the lens resolve to plaintext and
 * re-encrypt the moment you move on — the product's premise as a control.
 *
 * Written against the DOM directly (no React state per character) so a
 * 60-character headline costs one rAF pass, not sixty re-renders.
 */

import { useEffect, useRef } from 'react';
import { pointer, clamp } from '../lib/motion';

const GLYPHS = 'ABCDEF0123456789/\\<>[]{}#*+=%$@&';
const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

export default function DecryptField({
  text,
  radius = 165,
  className = '',
  as: Tag = 'span',
  style,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Build one span per character.
    root.textContent = '';
    root.setAttribute('aria-label', text);

    const spans = [];
    for (const ch of text) {
      const s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      if (ch === ' ') {
        s.innerHTML = '&nbsp;';
        s.dataset.space = '1';
      } else {
        s.textContent = rnd();
      }
      s.style.display = 'inline-block';
      s.style.transition = 'color 0.18s linear';
      root.appendChild(s);
      spans.push({ el: s, real: ch, cx: 0, cy: 0, revealed: false });
    }

    const measure = () => {
      for (const s of spans) {
        const r = s.el.getBoundingClientRect();
        s.cx = r.left + r.width / 2;
        s.cy = r.top + r.height / 2;
      }
    };
    measure();

    // Positions move with scroll; remeasure cheaply rather than per frame.
    let measureTimer;
    const scheduleMeasure = () => {
      clearTimeout(measureTimer);
      measureTimer = setTimeout(measure, 60);
    };
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', scheduleMeasure, { passive: true });

    let raf;
    let frame = 0;

    const loop = () => {
      frame++;
      // Churn the ciphertext at ~12fps; the reveal itself stays at 60.
      const churn = frame % 5 === 0;

      for (const s of spans) {
        if (s.el.dataset.space) continue;

        const d = Math.hypot(pointer.x - s.cx, pointer.y - s.cy);
        const inLens = d < radius;

        if (inLens) {
          if (!s.revealed) {
            s.el.textContent = s.real;
            s.revealed = true;
          }
          // Brightest at the centre of the lens, falling off to the edge.
          const t = clamp(1 - d / radius, 0, 1);
          s.el.style.color = `color-mix(in oklab, var(--accent) ${
            (t * 100) | 0
          }%, var(--ink))`;
          s.el.style.opacity = 1;
        } else {
          if (s.revealed) s.revealed = false;
          if (churn) s.el.textContent = rnd();
          s.el.style.color = 'var(--ink-4)';
          s.el.style.opacity = 0.85;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(measureTimer);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure);
    };
  }, [text, radius]);

  return <Tag ref={rootRef} className={className} style={style} />;
}
