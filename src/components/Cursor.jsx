/**
 * CURSOR
 *
 * Three bodies, three different lags — that difference is the whole effect:
 *   · dot   — near-instant, tracks the true pointer
 *   · ring  — heavy, trails behind, stretches along its direction of travel
 *   · label — appears inside the ring when hovering something declarative
 *
 * Any element can drive it:
 *   data-cursor="hover"    grow
 *   data-cursor="drag"     grow + label
 *   data-cursor="hide"     collapse the ring (over 3D you're already driving)
 *   data-cursor-label="…"  set the label text
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { bindPointer, pointer, damp, clamp } from '../lib/motion';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    bindPointer();

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    // Current state, integrated each frame toward the pointer.
    const s = {
      dx: pointer.x, dy: pointer.y,
      rx: pointer.x, ry: pointer.y,
      scale: 1, targetScale: 1,
      stretch: 0,
      rot: 0,
      opacity: 0,
    };

    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;

      // Dot is quick, ring is slow — the gap reads as weight.
      s.dx = damp(s.dx, pointer.x, 0.0008, dt);
      s.dy = damp(s.dy, pointer.y, 0.0008, dt);
      s.rx = damp(s.rx, pointer.x, 0.02, dt);
      s.ry = damp(s.ry, pointer.y, 0.02, dt);

      // Squash-and-stretch along the direction of travel. The ring elongates
      // when you flick the mouse and relaxes back to a circle at rest.
      const vx = pointer.x - s.rx;
      const vy = pointer.y - s.ry;
      const speed = Math.hypot(vx, vy);
      const targetStretch = clamp(speed / 130, 0, 0.46);
      s.stretch = damp(s.stretch, targetStretch, 0.002, dt);
      if (speed > 1.5) s.rot = (Math.atan2(vy, vx) * 180) / Math.PI;

      s.scale = damp(s.scale, s.targetScale, 0.0015, dt);
      s.opacity = damp(s.opacity, pointer.moved ? 1 : 0, 0.005, dt);

      dot.style.transform =
        `translate3d(${s.dx}px, ${s.dy}px, 0) translate(-50%, -50%) scale(${
          pointer.down ? 0.5 : 1
        })`;
      dot.style.opacity = s.opacity;

      ring.style.transform =
        `translate3d(${s.rx}px, ${s.ry}px, 0) translate(-50%, -50%) ` +
        `rotate(${s.rot}deg) scale(${s.scale * (1 + s.stretch)}, ${s.scale * (1 - s.stretch * 0.62)})`;
      ring.style.opacity = s.opacity;

      // Keep the label upright while the ring rotates with velocity.
      label.style.transform = `rotate(${-s.rot}deg)`;

      requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);

    /* ── Hover state machine ───────────────────────────────────
       Delegated, so content can mount and unmount freely. */

    const SCALES = { hover: 1.85, drag: 2.35, hide: 0, view: 2.1 };

    const resolve = (el) => el?.closest?.('[data-cursor]') ?? null;

    const onOver = (e) => {
      const target = resolve(e.target);
      if (!target) return;
      const mode = target.dataset.cursor;
      const text = target.dataset.cursorLabel;

      s.targetScale = SCALES[mode] ?? 1.85;
      ring.style.borderColor = mode === 'hide'
        ? 'transparent'
        : 'rgba(237,234,227,0.85)';

      if (text) {
        label.textContent = text;
        gsap.to(label, { opacity: 1, duration: 0.28, ease: 'power2.out' });
      }
    };

    const onOut = (e) => {
      if (!resolve(e.target)) return;
      // Ignore transitions between children of the same target.
      if (resolve(e.relatedTarget) === resolve(e.target)) return;
      s.targetScale = 1;
      ring.style.borderColor = 'rgba(237,234,227,0.55)';
      gsap.to(label, { opacity: 0, duration: 0.2, ease: 'power2.out' });
    };

    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <div className="cursor-layer" aria-hidden="true">
      <div ref={ringRef} className="cursor__ring">
        <span ref={labelRef} className="cursor__label" />
      </div>
      <div ref={dotRef} className="cursor__dot" />
    </div>
  );
}
