import { Link } from 'react-router-dom';
import { DOSSIERS, ORDER } from '../lib/dossiers';

/** Hand-off to the next dossier — the vault is a loop, not four dead ends. */
export default function NextUp({ from }) {
  const i = ORDER.indexOf(from);
  const next = DOSSIERS[ORDER[(i + 1) % ORDER.length]];

  return (
    <Link
      to={next.slug}
      className="nextup"
      data-dossier={next.id}
      data-cursor="view"
      data-cursor-label="Open"
    >
      <span className="nextup__k">Next dossier — {next.index}</span>
      <span className="nextup__n">{next.display}</span>
    </Link>
  );
}
