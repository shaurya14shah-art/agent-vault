/**
 * GLANCE — "what it looks like"
 *
 * A live procedural portrait of the product (see Signal) beside the three
 * surfaces you actually spend time in. Labelled as a schematic, because it
 * is one: these are drawn from the product's behaviour, not screenshots of it.
 */

import { useRef } from 'react';
import Signal, { useInView } from './Signal';
import { Marker } from './Sections';
import { useRise } from '../lib/motion';

export default function Glance({ n = '03', dossier, caption }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  useRise(ref, { selector: '.glance__item, .glance__frame', y: 34, stagger: 0.08 });

  return (
    <section className="section shell" ref={ref}>
      <Marker n={n} title="At a glance" right="Schematic" />

      <div
        style={{
          display: 'grid',
          gap: 'var(--s-7)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          alignItems: 'stretch',
        }}
      >
        <div
          className="glance__frame panel panel--ticked"
          style={{ padding: 0, aspectRatio: '16 / 10', overflow: 'hidden' }}
          data-cursor="hover"
          data-cursor-label="Live"
        >
          <Signal id={dossier.id} accent={dossier.accent} live={inView} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {dossier.glance.map((g, i) => (
            <div
              className="glance__item"
              key={g.k}
              style={{
                display: 'grid',
                gridTemplateColumns: '132px 1fr',
                gap: 'var(--s-5)',
                padding: 'var(--s-5) 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
              }}
            >
              <span className="t-mono t-mono--accent">{g.k}</span>
              <span style={{ color: 'var(--ink-2)', fontSize: '0.95rem' }}>{g.v}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="t-mono" style={{ marginTop: 'var(--s-6)' }}>
        {caption ?? 'Rendered live in your browser from the product’s own behaviour.'}
      </p>
    </section>
  );
}
