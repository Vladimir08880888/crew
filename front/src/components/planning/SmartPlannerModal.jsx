import { useState, useEffect, useMemo } from 'react';
import { Sparkles, AlertCircle, Check, X, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shiftsApi } from '../../api/shifts.api.js';
import { useToast } from '../../context/ToastContext.jsx';

const POSTE_EMOJI = { cuisine: '🍳', salle: '🍽️', bar: '🍷', plonge: '🧽', administration: '📋' };

function dateRange(from, to) {
  const days = [];
  const d = new Date(from);
  const end = new Date(to);
  while (d <= end) { days.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return days;
}

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
  const [capMidi, setCapMidi] = useState(100);
  const [capSoir, setCapSoir] = useState(100);

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR';
  const capacityByService = useMemo(() => ({ midi: capMidi, soir: capSoir }), [capMidi, capSoir]);

  useEffect(() => {
    setLoading(true);
    shiftsApi.generatePlan({ family_id: familyId, from, to, capacityByService })
      .then(setData)
      .catch((err) => { toast.fromError(err); onClose(); })
      .finally(() => setLoading(false));
  }, [familyId, from, to, capMidi, capSoir]);

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

            {/* Capacité par service : un slider pour midi, un pour soir.
                S'applique uniformément à tous les jours de la semaine. */}
            <div style={{ marginTop: '0.5rem' }}>
              <p className="muted" style={{ fontSize: '0.72rem', marginBottom: '0.3rem' }}>
                {t('smartPlanner.capacityHint', '50 % = service tranquille (cible divisée par deux). 100 % = jour plein. 150 % = grosse affluence.')}
              </p>
              <div className="row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>🍽️ {t('shifts.midi', 'Midi')}</span>
                    <strong>{capMidi} %</strong>
                  </label>
                  <input type="range" min={50} max={150} step={10}
                         value={capMidi}
                         onChange={(e) => setCapMidi(Number(e.target.value))}
                         style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>🌙 {t('shifts.soir', 'Soir')}</span>
                    <strong>{capSoir} %</strong>
                  </label>
                  <input type="range" min={50} max={150} step={10}
                         value={capSoir}
                         onChange={(e) => setCapSoir(Number(e.target.value))}
                         style={{ width: '100%' }} />
                </div>
              </div>
            </div>

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

            {/* Couverture par (jour, service, poste) */}
            {data.coverage && data.coverage.length > 0 && (
              <>
                <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{t('smartPlanner.coverageTitle', 'Couverture par service et poste')}</h4>
                <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: '0.85rem' }}>
                  {data.coverage.map((c, i) => {
                    const pct = c.ideal > 0 ? Math.round((c.actual_coef / c.ideal) * 100) : 0;
                    const color = pct >= 100 ? 'var(--success)'
                                : pct >= 50  ? 'var(--warning)'
                                : 'var(--danger)';
                    return (
                      <div key={i} className="row" style={{
                        padding: '0.25rem 0.4rem',
                        borderBottom: '1px solid var(--glass-border)',
                      }}>
                        <span style={{ flex: 1 }}>
                          {new Date(c.date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })}
                          {' — '}{POSTE_EMOJI[c.poste]} {t(`shifts.${c.service}`, c.service)} {t(`postes.${c.poste}`, c.poste)}
                        </span>
                        <span style={{ color, fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                          {c.actual_coef}/{c.ideal} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Slots non couverts (en dessous du seuil min) */}
            {data.uncovered.length > 0 && (
              <>
                <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                  <AlertCircle size={14} style={{ verticalAlign: '-2px' }} /> {t('smartPlanner.uncoveredTitle')}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', maxHeight: 150, overflowY: 'auto' }}>
                  {data.uncovered.map((s, i) => (
                    <li key={i} style={{ padding: '0.2rem 0', color: 'var(--text-muted)' }}>
                      {new Date(s.date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })}
                      {' — '}{POSTE_EMOJI[s.poste]} {t(`shifts.${s.service || s.shift_type}`, s.service || s.shift_type)} {t(`postes.${s.poste}`, s.poste)} : {s.actual_coef}/{s.ideal}
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
