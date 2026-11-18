/**
 * MARK GLYPH — the logo, flattened
 *
 * The 2D reduction of the hero mark: its silhouette is a rounded-square
 * annulus stood on a corner, so that's exactly what this draws.
 *
 * Deliberately quiet. It inherits `currentColor` and sits at low opacity —
 * at 20px a filled white logo would shout louder than the wordmark next to
 * it, and the mark's job in the nav is to be recognised, not to compete. It
 * only comes up to full strength on hover.
 */
export default function MarkGlyph({ size = 20, className = '', strokeWidth = 2.6 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(45 16 16)">
        <rect
          x={strokeWidth / 2 + 3}
          y={strokeWidth / 2 + 3}
          width={26 - strokeWidth}
          height={26 - strokeWidth}
          rx={9}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      </g>
    </svg>
  );
}
