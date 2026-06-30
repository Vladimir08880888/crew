/**
 * Logo de marque Crew : 4 barres colorées + wordmark.
 * Repris du logo de la présentation. Réutilisable (auth, 404, etc.).
 */
export function Brand({ wordmark = true, className = '' }) {
  return (
    <div className={`brand-block ${className}`}>
      <span className="brand-logo brand-logo-lg" aria-hidden="true">
        <i></i><i></i><i></i><i></i>
      </span>
      {wordmark && <span className="brand-word">Crew</span>}
    </div>
  );
}
