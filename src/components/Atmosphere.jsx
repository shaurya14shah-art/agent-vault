/**
 * ATMOSPHERE
 *
 * Film grain and a vignette, sitting above everything and below the cursor.
 * They cost almost nothing and are most of the difference between "dark page"
 * and "dark material".
 */
export default function Atmosphere() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
