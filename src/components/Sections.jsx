/**
 * SECTION BLOCKS
 *
 * Shared structure, per-dossier accent. The *choreography* that moves these
 * around lives in each page — this file only owns what they are, not how
 * they arrive.
 */

import { useRef } from 'react';
import { useLineReveal, useRise, useScramble } from '../lib/motion';

/* ── Section marker: 01 / OVERVIEW ─────────────────────────── */

export function Marker({ n, title, right }) {
  const ref = useRef(null);
  useScramble(ref, title);
  return (
    <div className="marker">
      <span className="marker__n">{n}</span>
      <span ref={ref} className="marker__t">{title}</span>
      {right && <span className="marker__t marker__r">{right}</span>}
    </div>
  );
}

/* ── Overview ──────────────────────────────────────────────── */

export function Overview({ n = '01', tagline, lede }) {
  const tagRef = useRef(null);
  const ledeRef = useRef(null);
  useLineReveal(tagRef, { stagger: 0.1 });
  useLineReveal(ledeRef, { stagger: 0.055, duration: 1, delay: 0.12 });

  return (
    <section className="section shell">
      <Marker n={n} title="Overview" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 'var(--s-7)',
        }}
      >
        <h2 ref={tagRef} className="t-huge" style={{ maxWidth: '18ch' }}>
          {tagline}
        </h2>
        <p
          ref={ledeRef}
          className="t-lead"
          style={{ maxWidth: '68ch', marginLeft: 'auto' }}
        >
          {lede}
        </p>
      </div>
    </section>
  );
}

/* ── Key features ──────────────────────────────────────────── */

export function Features({ n = '02', items = [] }) {
  const ref = useRef(null);
  useRise(ref, { selector: '.feat', y: 34, stagger: 0.06 });

  return (
    <section className="section shell" ref={ref}>
      <Marker n={n} title="Key Features" right={`${items.length} entries`} />
      <div>
        {items.map((f, i) => (
          <article className="feat" key={f.h} data-cursor="hover">
            <span className="feat__n">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="feat__h">{f.h}</h3>
              <p className="feat__b">{f.b}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── Specs ─────────────────────────────────────────────────── */

export function Specs({ n = '03', rows = [], note }) {
  const ref = useRef(null);
  useRise(ref, { selector: '.spec__row', y: 22, stagger: 0.04 });

  return (
    <section className="section shell" ref={ref}>
      <Marker n={n} title="Specification" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '0 var(--s-9)',
        }}
      >
        <div className="spec">
          {rows.slice(0, Math.ceil(rows.length / 2)).map(([k, v]) => (
            <div className="spec__row" key={k}>
              <span className="spec__k">{k}</span>
              <span className="spec__v">{v}</span>
            </div>
          ))}
        </div>
        <div className="spec">
          {rows.slice(Math.ceil(rows.length / 2)).map(([k, v]) => (
            <div className="spec__row" key={k}>
              <span className="spec__k">{k}</span>
              <span className="spec__v">{v}</span>
            </div>
          ))}
        </div>
      </div>
      {note && (
        <p className="t-mono" style={{ marginTop: 'var(--s-6)' }}>
          {note}
        </p>
      )}
    </section>
  );
}

/* ── Thank you ─────────────────────────────────────────────── */

export function ThankYou({ line, sub, children }) {
  const ref = useRef(null);
  const subRef = useRef(null);
  useRise(ref, { selector: '.thanks__word', y: 70, stagger: 0.09 });
  useLineReveal(subRef, { stagger: 0.06 });

  return (
    <section className="thanks shell" ref={ref}>
      <div className="thanks__word">Thank</div>
      <div className="thanks__word thanks__word--fill">You</div>
      <p
        ref={subRef}
        className="t-lead"
        style={{
          margin: 'var(--s-7) auto 0',
          maxWidth: '52ch',
          textAlign: 'center',
        }}
      >
        {line}
      </p>
      {sub && (
        <p className="t-mono" style={{ marginTop: 'var(--s-5)' }}>
          {sub}
        </p>
      )}
      {children}
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────── */

export function Footer({ note }) {
  return (
    <footer className="foot">
      <span>Agent Vault</span>
      <span>{note ?? 'Built and shipped solo'}</span>
      <span>Agent X · MMXXVI</span>
    </footer>
  );
}
