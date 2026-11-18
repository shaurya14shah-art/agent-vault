import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from '../lib/motion';
import { DOSSIERS } from '../lib/dossiers';
import MarkGlyph from './MarkGlyph';

/** Mono clock, ticking. Small signal that the page is live. */
function Clock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' });
    setT(fmt());
    const i = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(i);
  }, []);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t} UTC</span>;
}

export default function Nav() {
  const { pathname } = useLocation();
  const ref = useRef(null);
  const dossier = Object.values(DOSSIERS).find((d) => d.slug === pathname);
  const isHome = pathname === '/';

  // Nav lifts in after the boot sequence clears.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: -30,
        opacity: 0,
        duration: 1,
        delay: isHome ? 2.1 : 0.4,
        ease: 'expo.out',
      });
    }, ref);
    return () => ctx.revert();
  }, [pathname, isHome]);

  return (
    <nav ref={ref} className="nav">
      {isHome ? (
        <span className="nav__mark">
          <MarkGlyph className="nav__glyph" />
          <span>Agent Vault</span>
        </span>
      ) : (
        <Link to="/" className="backlink" data-cursor="hover" data-cursor-label="Vault">
          <span className="backlink__arrow">←</span>
          <span>Agent Vault</span>
        </Link>
      )}

      <div className="nav__meta">
        {dossier && (
          <span style={{ color: dossier.accent }}>
            {dossier.index} / {dossier.display}
          </span>
        )}
        <span className="nav__hide"><Clock /></span>
        <span className="nav__hide">Agent&nbsp;X</span>
      </div>
    </nav>
  );
}
