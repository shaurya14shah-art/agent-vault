/**
 * GAME X — 04
 *
 * The title stays sealed. The world does not.
 *
 * Landing interaction: the cursor is a torch. The title only exists where its
 * light falls — the same way the game's caves read.
 *
 * Scroll mechanic: scrolling flies you forward through generated terrain. The
 * biome ticker in the corner changes as you travel, because the ground under
 * you genuinely changes — the mesh is re-evaluated against a moving fBm
 * window, which is how the game streams its own chunks.
 */

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';

import Terrain from '../three/Terrain';
import TorchTitle from '../components/TorchTitle';
import Marquee from '../components/Marquee';
import Glance from '../components/Glance';
import Download from '../components/Download';
import NextUp from '../components/NextUp';
import { Overview, Features, Specs, ThankYou, Footer } from '../components/Sections';
import { DOSSIERS } from '../lib/dossiers';
import { useIso, useLineReveal, useFitToWidth, ScrollTrigger } from '../lib/motion';

import '../styles/dossier.css';

const D = DOSSIERS.fracture;

/* All sixteen, straight from the game's biome manager. */
const BIOMES = [
  'Verdant Plains', 'Enchanted Forest', 'Volcanic Wastes', 'Crystal Caverns',
  'Frozen Tundra', 'Desert Ruins', 'Twilight Swamp', 'Shadow Realm',
  'Celestial Peaks', 'Living Jungle', 'Obsidian Wastes', 'Glowing Grotto',
  'Crimson Rift', 'Fungal Wastes', 'Astral Highlands', 'The Sanctuary',
];

export default function GameX() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const chapterLineRef = useRef(null);
  const travelRef = useRef(0);
  const biomeNameRef = useRef(null);
  const biomeIdxRef = useRef(null);

  useLineReveal(chapterLineRef, { stagger: 0.1, start: 'top 74%' });
  // Solve the title's size against the real column width — a vw guess
  // renders wider in Safari than in Chrome and breaks the word mid-line.
  useFitToWidth(pageRef, '.dhero__title', { max: 260 });

  useIso(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dhero__eyebrow', { opacity: 0, y: 18, duration: 1, delay: 0.3, ease: 'expo.out' });
      gsap.from('.torch', { opacity: 0, y: 50, duration: 1.4, delay: 0.4, ease: 'expo.out' });
      gsap.from('.dhero__tag', { opacity: 0, y: 24, duration: 1.1, delay: 0.7, ease: 'expo.out' });
      gsap.from('.dhero__foot, .biome', { opacity: 0, duration: 1, delay: 1 });

      /* Travel drives the terrain and the biome ticker. */
      let lastIdx = -1;
      ScrollTrigger.create({
        trigger: pageRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          travelRef.current = self.progress;

          const idx = Math.min(
            BIOMES.length - 1,
            Math.floor(self.progress * BIOMES.length)
          );
          if (idx !== lastIdx) {
            lastIdx = idx;
            if (biomeNameRef.current) {
              // Swap with a quick flicker rather than a cross-fade — it should
              // feel like a region marker snapping in, not a UI transition.
              gsap.fromTo(biomeNameRef.current,
                { opacity: 0, y: 12, skewX: -8 },
                { opacity: 1, y: 0, skewX: 0, duration: 0.5, ease: 'expo.out' });
              biomeNameRef.current.textContent = BIOMES[idx];
            }
            if (biomeIdxRef.current) {
              biomeIdxRef.current.textContent =
                `${String(idx + 1).padStart(2, '0')} / 16`;
            }
          }
        },
      });

      gsap.to('.dhero__body', {
        yPercent: -12,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true,
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="page" data-dossier="fracture" ref={pageRef}>
      <div className="canvas-fixed">
        <Canvas camera={{ position: [0, 1.4, 15], fov: 52 }} dpr={[1, 1.6]}>
          <Terrain travelRef={travelRef} />
        </Canvas>
      </div>

      {/* Biome ticker — fixed, so it reads as a HUD element */}
      <div className="biome">
        <span className="biome__n" ref={biomeNameRef}>Verdant Plains</span>
        <span className="biome__i" ref={biomeIdxRef}>01 / 16</span>
      </div>

      <section className="dhero" ref={heroRef}>
        <div className="dhero__body">
          <div className="dhero__eyebrow">
            <span>{D.index}</span><span>/</span><b>{D.classification}</b>
          </div>

          <h1 className="dhero__title" style={{ lineHeight: 0.9 }}>
            <TorchTitle text="GAME X" radius={210} />
          </h1>

          <p className="dhero__tag">
            The real title is sealed until release. Your cursor is the only
            light here — move it to read anything at all.
          </p>
        </div>

        <div className="dhero__foot">
          <span className="hint">
            <span className="hint__line" />
            Scroll to fly the world
          </span>
          <span>16 biomes · generated, not authored</span>
        </div>
      </section>

      <div className="readout">
        <span>Title · <b>WITHHELD</b></span>
        <span>Biomes · <b>16</b></span>
        <span>Classes · <b>8</b></span>
        <span>Network · <b>NONE</b></span>
      </div>

      <Overview n="01" tagline={D.tagline} lede={D.lede} />

      <section className="chapter">
        <p className="chapter__line" ref={chapterLineRef}>
          The map is not hidden from you. It has not been drawn yet.
        </p>
      </section>

      <Features n="02" items={D.features} />

      <Glance
        n="03"
        dossier={D}
        caption="Left: chunks resolving at the horizon from the same kind of noise function the game uses."
      />

      <Marquee
        items={['16 biomes', '·', '8 classes', '·', '75 materials', '·', 'No servers', '·']}
        speed={0.55}
      />

      <Specs
        n="04"
        rows={D.specs}
        note="Unzip and open index.html, or serve the folder locally. No install, no account."
      />

      <Download
        n="05"
        dossier={D}
        note="Preview build. Unzip and open the folder's index.html in a modern browser — a local static server gives the best results."
      />

      <ThankYou
        line="Thank you for walking through a world that only existed because you scrolled. The name comes later. The ground was always going to be here first."
        sub="Game X · 04 of 04"
      />

      <NextUp from="fracture" />
      <Footer note="Dossier 04 — Title withheld" />
    </div>
  );
}
