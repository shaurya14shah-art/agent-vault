/**
 * SMOOTH SCROLL
 *
 * Lenis is the single owner of scroll position. ScrollTrigger is told to
 * read from it rather than from the native scroller, and both are driven
 * from GSAP's ticker so there is exactly one RAF loop for the page.
 *
 * Getting this wiring wrong is the usual cause of "jittery" scroll sites:
 * two independent loops fighting over the same value.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, bindScrollVelocity, bindPointer } from '../lib/motion';

let lenis = null;
export const getLenis = () => lenis;

export default function SmoothScroll({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    bindPointer();

    lenis = new Lenis({
      duration: 1.15,
      // Long, flat easing — the "expensive" glide. Short easings feel cheap.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.6,
      lerp: 0.09,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    bindScrollVelocity();

    // Pinned sections change document height; refresh once it settles.
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(refresh);
      gsap.ticker.remove(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // Route change: jump to top instantly and rebuild all triggers, otherwise
  // the new page inherits the old page's measurements.
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
    const t = setTimeout(() => ScrollTrigger.refresh(true), 240);
    return () => clearTimeout(t);
  }, [pathname]);

  return children;
}
