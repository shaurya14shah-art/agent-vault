import { useRef } from 'react';
import { useMagnetic } from '../lib/motion';

/**
 * Wraps a child so it leans toward the cursor. The inner span leans further,
 * which gives a button a sense of thickness rather than sliding as one slab.
 */
export default function Magnetic({
  children,
  strength = 0.38,
  radius = 130,
  className = '',
  as: Tag = 'span',
}) {
  const ref = useRef(null);
  useMagnetic(ref, { strength, radius });

  return (
    <Tag ref={ref} className={`mag ${className}`}>
      <span className="mag__inner">{children}</span>
    </Tag>
  );
}
