/**
 * AGENT CIPHER — 01
 *
 * Landing interaction: the headline is ciphertext and your cursor is the key.
 * Scroll mechanic: scrolling *seals the vault*. Page progress drives a single
 * `seal` value that the 3D lattice, the readout, and the type all read from —
 * so moving down the page is the act of encrypting, and it is legible as that
 * in three places at once.
 */

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';

import VaultLattice from '../three/VaultLattice';
import DecryptField from '../components/DecryptField';
import Marquee from '../components/Marquee';
import Glance from '../components/Glance';
import Download from '../components/Download';
import NextUp from '../components/NextUp';
import { Overview, Features, Specs, ThankYou, Footer } from '../components/Sections';
import { DOSSIERS } from '../lib/dossiers';
import { useIso, useLineReveal, useFitToWidth, ScrollTrigger } from '../lib/motion';

import '../styles/dossier.css';

const D = DOSSIERS.cipher;

export default function AgentCipher() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const chapterRef = useRef(null);
  const chapterLineRef = useRef(null);
  const sealRef = useRef(0);
  const readoutRef = useRef(null);

  useLineReveal(chapterLineRef, { stagger: 0.1, start: 'top 72%' });
  // Solve the title's size against the real column width — a vw guess
  // renders wider in Safari than in Chrome and breaks the word mid-line.
  useFitToWidth(pageRef, '.dhero__title', { max: 260 });

  useIso(() => {
    const ctx = gsap.context(() => {
      /* Entry */
      gsap.from('.dhero__eyebrow', { opacity: 0, y: 18, duration: 1, delay: 0.35, ease: 'expo.out' });
      gsap.from('.dhero__title', { opacity: 0, y: 60, duration: 1.4, delay: 0.45, ease: 'expo.out' });
      gsap.from('.dhero__tag', { opacity: 0, y: 24, duration: 1.1, delay: 0.7, ease: 'expo.out' });
      gsap.from('.dhero__foot', { opacity: 0, duration: 1, delay: 1 });

      /* The seal. One scroll range, three consumers. */
      ScrollTrigger.create({
        trigger: pageRef.current,
        start: 'top top',
        end: '+=2600',
        scrub: true,
        onUpdate: (self) => {
          sealRef.current = self.progress;
          if (readoutRef.current) {
            const pct = Math.round(self.progress * 100);
            readoutRef.current.textContent =
              pct >= 99 ? 'SEALED' : `SEALING ${String(pct).padStart(2, '0')}%`;
          }
        },
      });

      /* Hero contents lift away as the seal engages */
      gsap.to('.dhero__body', {
        yPercent: -14,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      /* Pinned chapter: the line holds while the lattice locks behind it */
      gsap.timeline({
        scrollTrigger: {
          trigger: chapterRef.current,
          start: 'top top',
          end: '+=900',
          scrub: 1,
          pin: true,
        },
      })
        .fromTo('.chapter__line',
          { scale: 0.94, filter: 'blur(6px)', opacity: 0.2 },
          { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.5, ease: 'power2.out' })
        .to('.chapter__line', { opacity: 0, scale: 1.05, duration: 0.35 }, 0.72);
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="page" data-dossier="cipher" ref={pageRef}>
      {/* The lattice stays fixed behind the whole page and keeps sealing. */}
      <div className="canvas-fixed" style={{ pointerEvents: 'auto' }}>
        <Canvas camera={{ position: [0, 0, 7.2], fov: 42 }} dpr={[1, 1.75]}>
          <VaultLattice sealRef={sealRef} />
        </Canvas>
      </div>

      <section className="dhero" ref={heroRef}>
        <div className="dhero__body">
          <div className="dhero__eyebrow">
            <span>{D.index}</span>
            <span>/</span>
            <b>{D.classification}</b>
          </div>

          {/* Ciphertext headline — cursor is the key */}
          <DecryptField
            as="h1"
            className="dhero__title"
            text="AGENT CIPHER"
            radius={190}
            style={{ display: 'block' }}
          />

          <p className="dhero__tag">
            Move your cursor across the title. That is the whole product:
            nothing is readable until the key is present.
          </p>
        </div>

        <div className="dhero__foot">
          <span className="hint">
            <span className="hint__line" />
            Scroll to seal the vault
          </span>
          <span>AES-256-GCM · Rust core</span>
        </div>
      </section>

      <div className="readout">
        <span>Vault state · <b ref={readoutRef}>OPEN</b></span>
        <span>Cipher · <b>AES-256-GCM</b></span>
        <span>Digest · <b>SHA-256</b></span>
        <span>Egress · <b>NONE</b></span>
      </div>

      <Overview n="01" tagline={D.tagline} lede={D.lede} />

      <section className="chapter" ref={chapterRef}>
        <p className="chapter__line" ref={chapterLineRef}>
          The safest place for your files is the machine already in front of you.
        </p>
      </section>

      <Features n="02" items={D.features} />

      <Glance
        n="03"
        dossier={D}
        caption="Left: plaintext sealing into ciphertext block by block, the way the enclave does it."
      />

      <Marquee items={['Zero egress', '·', 'Local first', '·', 'No account', '·']} speed={0.45} />

      <Specs
        n="04"
        rows={D.specs}
        note="No server component. Nothing to sign up for, nothing to cancel."
      />

      <Download n="05" dossier={D} />

      <ThankYou
        line="Thank you for looking at something that deliberately does less — no sync service, no dashboard, no account. Just your files, sealed, on your own disk."
        sub="Agent Cipher · 01 of 04"
      />

      <NextUp from="cipher" />
      <Footer note="Dossier 01 — Cipher" />
    </div>
  );
}
