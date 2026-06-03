import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shiftsApi } from '../../api/shifts.api.js';

const POSTE_EMOJI = {
  cuisine: '🍳', salle: '🍽️', bar: '🍷', plonge: '🧽', administration: '📋',
};

/**
 * Widget « Mes prochains services » affiché sur le dashboard.
 * Liste les 5 prochains shifts de l'utilisateur connecté.
 */
export function UpcomingShifts() {
  const { t, i18n } = useTranslation();
  const [shifts, setShifts] = useState(null);

  useEffect(() => {
    shiftsApi.upcoming(5)
      .then(setShifts)
      .catch(() => setShifts([]));
  }, []);

  if (shifts === null) return null;     // chargement silencieux

  // Si aucun shift : ne pas afficher le widget (évite le bruit visuel)
  if (shifts.length === 0) return null;

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR';

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>
          <CalendarDays size={16} style={{ verticalAlign: '-2px' }} /> {t('planning.upcoming')}
        </h3>
        <Link to="/planning" className="muted" style={{ fontSize: '0.85rem' }}>
          {t('planning.title')} <ArrowRight size={14} style={{ verticalAlign: '-2px' }} />
        </Link>
      </div>

      <ul className="upcoming-shifts" style={{ listStyle: 'none', padding: 0, marginTop: '0.75rem' }}>
        {shifts.map((s) => {
          const d = new Date(s.date);
          return (
            <li key={s.id} className="row" style={{
              padding: '0.5rem 0.75rem',
              borderBottom: '1px solid var(--glass-border)',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}>
              <span style={{ minWidth: 90, fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
                {d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className={`shift-pill shift-${s.shift_type}`} style={{ marginBottom: 0 }}>
                {POSTE_EMOJI[s.poste] || '🍴'} {t(`shifts.${s.shift_type}`, s.shift_type)} — {t(`postes.${s.poste}`, s.poste)}
              </span>
              {s.note && <span className="muted" style={{ fontSize: '0.8rem' }}>· {s.note}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
