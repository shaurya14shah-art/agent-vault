/**
 * TORCH TITLE — Game X's landing interaction
 *
 * The title is dark. Your cursor carries the only light in the frame, and the
 * lettering only exists where the light falls — which is how the game's caves
 * actually read. Implemented as a CSS mask driven from rAF so it costs one
 * style write per frame and no layout.
 */

import { useEffect, useRef } from 'react';
import { pointer, damp, clamp } from '../lib/motion';

export default function TorchTitle({ text, radius = 190, className = '' }) {
  const wrapRef = useRef(null);
  const litRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const lit = litRef.current;
    if (!wrap || !lit) return;

    let x = 0, y = 0, r = radius * 0.6;
    let last = performance.now();
    let raf;

    const tick = () => {
      const now = performance.now();
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;

      const rect = wrap.getBoundingClientRect();
      const tx = pointer.x - rect.left;
      const ty = pointer.y - rect.top;

      x = damp(x, tx, 0.003, dt);
      y = damp(y, ty, 0.003, dt);

      // The torch flickers, faintly.
      const flicker = 1 + Math.sin(now * 0.006) * 0.04 + Math.sin(now * 0.021) * 0.02;
      r = damp(r, radius * flicker, 0.02, dt);

      const mask =
        `radial-gradient(circle ${r.toFixed(0)}px at ${x.toFixed(0)}px ${y.toFixed(0)}px, ` +
        `#000 0%, rgba(0,0,0,0.86) 42%, transparent 76%)`;
      lit.style.webkitMaskImage = mask;
      lit.style.maskImage = mask;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [radius]);

  return (
    <span className={`torch ${className}`} ref={wrapRef}>
      <span className="torch__base" aria-hidden="true">{text}</span>
      <span className="torch__lit" ref={litRef} aria-hidden="true">{text}</span>
      <span className="sr">{text}</span>
    </span>
  );
}
