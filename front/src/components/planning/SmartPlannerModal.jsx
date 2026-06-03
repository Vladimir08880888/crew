import { useState } from 'react';
import { Sparkles, AlertCircle, Check, X, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shiftsApi } from '../../api/shifts.api.js';
import { useToast } from '../../context/ToastContext.jsx';

const POSTE_EMOJI = { cuisine: '🍳', salle: '🍽️', bar: '🍷', plonge: '🧽', administration: '📋' };

/**
 * Modal qui :
 *   1. Affiche un aperçu (preview) du planning généré
 *   2. Liste les slots non couverts
 *   3. Montre l'impact en heures par membre
 *   4. Bouton "Appliquer" qui crée les shifts en base
 */
export function SmartPlannerModal({ familyId, from, to, onClose, onApplied }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [data, setData] = useState(null);

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR';

  // Charger la proposition à l'ouverture
  useState(() => {
    shiftsApi.generatePlan({ family_id: familyId, from, to })
      .then(setData)
      .catch((err) => { toast.fromError(err); onClose(); })
      .finally(() => setLoading(false));
  }, []);

  async function apply() {
    setApplying(true);
    try {
      const result = await shiftsApi.applyPlan({
        family_id: familyId,
        shifts: data.suggested,
      });
      toast.success(t('smartPlanner.appliedToast', { n: result.created }));
      onApplied();
    } catch (err) {
      toast.fromError(err);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h3><Sparkles size={18} style={{ verticalAlign: '-3px' }} /> {t('smartPlanner.title')}</h3>
          <button className="ghost icon-only" onClick={onClose}><X size={18} /></button>
        </div>

        {loading && (
          <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader size={20} className="spin" /> {t('smartPlanner.computing')}
          </p>
        )}

        {!loading && data && (
          <>
            <p className="muted">{t('smartPlanner.weekRange', {
              from: new Date(from).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
              to:   new Date(to).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
            })}</p>

            {/* Stats globales */}
            <div className="row" style={{ gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <div className="stat-card" style={{ flex: 1, minWidth: 130 }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem' }}>{t('smartPlanner.suggested')}</h3>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{data.suggested.length}</div>
              </div>
              <div className="stat-card" style={{
                flex: 1, minWidth: 130,
                ...(data.uncovered.length ? { borderColor: 'var(--danger)' } : {}),
              }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem' }}>{t('smartPlanner.uncovered')}</h3>
                <div className="stat-value" style={{
                  fontSize: '1.5rem',
                  color: data.uncovered.length ? 'var(--danger)' : 'var(--success)',
                }}>{data.uncovered.length}</div>
              </div>
            </div>

            {/* Heures par membre */}
            <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{t('smartPlanner.hoursPerMember')}</h4>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {Object.entries(data.hours).map(([uid, h]) => {
                if (h.target === 0) return null;
                const ratio = h.target ? h.planned / h.target : 0;
                const color = ratio < 0.85 ? 'var(--warning)'
                            : ratio > 1.1  ? 'var(--danger)'
                            : 'var(--success)';
                return (
                  <div key={uid} className="row" style={{
                    padding: '0.3rem 0.5rem',
                    borderBottom: '1px solid var(--glass-border)',
                    fontSize: '0.9rem',
                  }}>
                    <span style={{ flex: 1 }}>
                      {data.suggested.find((s) => s.user_id === Number(uid))?.first_name
                        || data.hours[uid].first_name
                        || `User ${uid}`}
                    </span>
                    <span style={{ color, fontWeight: 600 }}>
                      {h.planned}h / {h.target}h
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Slots non couverts */}
            {data.uncovered.length > 0 && (
              <>
                <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                  <AlertCircle size={14} style={{ verticalAlign: '-2px' }} /> {t('smartPlanner.uncoveredTitle')}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', maxHeight: 150, overflowY: 'auto' }}>
                  {data.uncovered.map((s, i) => (
                    <li key={i} style={{ padding: '0.2rem 0', color: 'var(--text-muted)' }}>
                      {new Date(s.date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })}
                      {' — '}{POSTE_EMOJI[s.poste]} {t(`shifts.${s.shift_type}`, s.shift_type)} {t(`postes.${s.poste}`, s.poste)}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="row" style={{ marginTop: '1.25rem' }}>
              <button onClick={apply} disabled={applying || data.suggested.length === 0}>
                <Check size={14} />
                {applying ? t('common.loading') : t('smartPlanner.apply', { n: data.suggested.length })}
              </button>
              <button className="secondary" onClick={onClose}>{t('common.cancel')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
