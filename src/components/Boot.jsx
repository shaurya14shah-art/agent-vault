/**
 * BOOT
 *
 * A short, honest loading gate: it counts while the 3D scene compiles, then
 * lifts. Runs once per session — coming back from a dossier page shouldn't
 * make you sit through it again.
 */

import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/motion';

let hasBooted = false;
export const bootedAlready = () => hasBooted;

export default function Boot({ onDone }) {
  const rootRef = useRef(null);
  const fillRef = useRef(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const counter = { v: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        hasBooted = true;
        onDone?.();
      },
    });

    tl.to(counter, {
      v: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => setPct(Math.round(counter.v)),
    })
      .to(fillRef.current, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(rootRef.current, {
        yPercent: -100,
        duration: 1.05,
        ease: 'expo.inOut',
      }, '+=0.16');

    return () => tl.kill();
  }, [onDone]);

  return (
    <div className="boot" ref={rootRef}>
      <div className="boot__inner">
        <div className="boot__row">
          <span>Agent Vault</span>
          <span className="boot__pct">{String(pct).padStart(3, '0')}</span>
        </div>
        <div className="boot__track">
          <div ref={fillRef} className="boot__fill" />
        </div>
        <div className="boot__row" style={{ marginTop: 'var(--s-4)', marginBottom: 0 }}>
          <span>Four dossiers</span>
          <span>Agent X</span>
        </div>
      </div>
    </div>
  );
}
