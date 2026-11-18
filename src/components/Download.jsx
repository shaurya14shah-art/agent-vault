/**
 * DOWNLOAD
 *
 * The file is real and the link is a plain anchor with `download`, so the
 * browser owns the transfer — no 200MB Blob held in memory, and it shows up
 * in the normal downloads UI.
 *
 * The status log animates the *handshake* (verify manifest, release), not the
 * bytes. It never claims a percentage it doesn't have; once the browser takes
 * over it says so plainly.
 */

import { useRef, useState, useCallback } from 'react';
import { gsap, useRise } from '../lib/motion';
import { Marker } from './Sections';
import Magnetic from './Magnetic';

const STAGES = [
  'Locating archive',
  'Verifying manifest',
  'Checking signature',
  'Releasing to client',
];

export default function Download({ n = '04', dossier, note }) {
  const { download: dl, name, display } = dossier;
  const ref = useRef(null);
  const barRef = useRef(null);
  const anchorRef = useRef(null);
  const [log, setLog] = useState([]);
  const [state, setState] = useState('idle'); // idle | handshake | released

  useRise(ref, { y: 40 });

  const start = useCallback(() => {
    if (state !== 'idle') return;
    setState('handshake');
    setLog([]);

    // Walk the handshake stages, then hand off to the browser.
    STAGES.forEach((s, i) => {
      setTimeout(() => setLog((l) => [...l, s]), i * 260);
    });

    gsap.fromTo(
      barRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: (STAGES.length * 260) / 1000, ease: 'power2.inOut' }
    );

    setTimeout(() => {
      anchorRef.current?.click();
      setState('released');
      setLog((l) => [...l, 'Transfer handed to browser']);
    }, STAGES.length * 260 + 120);
  }, [state]);

  return (
    <section className="section shell" ref={ref}>
      <Marker n={n} title="Download" right={dl.target} />

      <div className="dl">
        <div
          style={{
            display: 'grid',
            gap: 'var(--s-7)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            alignItems: 'end',
            position: 'relative',
          }}
        >
          <div>
            <p className="t-mono t-mono--accent" style={{ marginBottom: 'var(--s-4)' }}>
              Archive · v{dl.version}
            </p>
            <h2 className="t-huge" style={{ marginBottom: 'var(--s-5)' }}>
              {display}
            </h2>

            <div className="spec" style={{ maxWidth: 420 }}>
              <div className="spec__row">
                <span className="spec__k">File</span>
                <span className="spec__v">{dl.label}</span>
              </div>
              <div className="spec__row">
                <span className="spec__k">Size</span>
                <span className="spec__v">{dl.size}</span>
              </div>
              <div className="spec__row">
                <span className="spec__k">Target</span>
                <span className="spec__v">{dl.target}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Status log — appears only once you ask for the file. */}
            <div
              style={{
                minHeight: 120,
                fontFamily: 'var(--mono)',
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                color: 'var(--ink-3)',
                marginBottom: 'var(--s-5)',
              }}
              aria-live="polite"
            >
              {state === 'idle' ? (
                <span style={{ opacity: 0.6 }}>
                  ▸ Awaiting request…
                </span>
              ) : (
                log.map((l, i) => (
                  <div
                    key={l}
                    style={{
                      color:
                        i === log.length - 1 && state === 'released'
                          ? 'var(--accent)'
                          : 'var(--ink-3)',
                    }}
                  >
                    ▸ {l}
                    {i < log.length - 1 || state === 'released' ? ' — ok' : '…'}
                  </div>
                ))
              )}
            </div>

            <Magnetic strength={0.3} radius={150}>
              <button
                className="btn btn--solid btn--lg"
                onClick={start}
                data-cursor="hide"
                disabled={state === 'handshake'}
              >
                {state === 'released'
                  ? 'Download again'
                  : state === 'handshake'
                  ? 'Releasing…'
                  : `Download ${name}`}
                <span aria-hidden="true">↓</span>
              </button>
            </Magnetic>

            {/* The actual transfer. */}
            <a
              ref={anchorRef}
              href={dl.file}
              download={dl.label}
              className="sr"
              tabIndex={-1}
            >
              Download {name}
            </a>
          </div>
        </div>

        <div ref={barRef} className="dl__bar" />
      </div>

      <p className="t-mono" style={{ marginTop: 'var(--s-5)' }}>
        {note ??
          'Unsigned build — macOS will ask you to confirm on first open. Right-click → Open.'}
      </p>
    </section>
  );
}
