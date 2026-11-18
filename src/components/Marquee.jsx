import { useEffect, useRef } from 'react';
import { gsap, scrollState } from '../lib/motion';

/**
 * A marquee that is *pushed* by scroll rather than merely animated.
 * Baseline drift keeps it alive at rest; scroll velocity adds to it and can
 * reverse it, so the band physically responds to how you're moving the page.
 */
export default function Marquee({
  items = [],
  speed = 0.6,
  direction = 1,
  ghostEvery = 2,
  className = '',
}) {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // The track holds two identical runs; wrapping at half-width is seamless.
    let x = 0;
    const halfWidth = () => track.scrollWidth / 2;

    const tick = () => {
      const push = scrollState.velocity * 34;
      x -= speed * direction + push;

      const w = halfWidth();
      if (w > 0) {
        if (x <= -w) x += w;
        if (x > 0) x -= w;
      }
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [speed, direction]);

  const run = [...items, ...items];

  return (
    <div className={`marquee ${className}`} aria-hidden="true">
      <div ref={trackRef} className="marquee__track">
        {run.map((item, i) => (
          <span
            key={i}
            className={`marquee__item ${
              ghostEvery && i % ghostEvery === 1 ? 'marquee__item--ghost' : ''
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
