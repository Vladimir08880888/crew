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
  // Densité par (date, service). Initialisé à 100 partout via lazy init.
  const [perCell, setPerCell] = useState(() => {
    const map = {};
    for (const d of dateRange(from, to)) map[d] = { midi: 100, soir: 100 };
    return map;
  });

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR';

  function setCell(date, service, value) {
    setPerCell((prev) => ({ ...prev, [date]: { ...prev[date], [service]: value } }));
  }
  function setAll(service, value) {
    setPerCell((prev) => {
      const next = { ...prev };
      for (const d of Object.keys(next)) next[d] = { ...next[d], [service]: value };
      return next;
    });
  }

  useEffect(() => {
    setLoading(true);
    shiftsApi.generatePlan({ family_id: familyId, from, to, capacityByDateAndService: perCell })
      .then(setData)
      .catch((err) => { toast.fromError(err); onClose(); })
      .finally(() => setLoading(false));
  }, [familyId, from, to, perCell]);

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

            {/* Densité par (jour, service) — manager prévoit chaque service de la semaine */}
            <div style={{ marginTop: '0.5rem' }}>
              <p className="muted" style={{ fontSize: '0.72rem', marginBottom: '0.3rem' }}>
                {t('smartPlanner.densityHint3', "Densité prévue de chaque service. 1,0 = standard, 0,5 = calme, 1,3 = chargé.")}
              </p>
              <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>{t('smartPlanner.day', 'Jour')}</th>
                    <th style={{ textAlign: 'center' }}>🍽️ {t('shifts.midi', 'Midi')}</th>
                    <th style={{ textAlign: 'center' }}>🌙 {t('shifts.soir', 'Soir')}</th>
                  </tr>
                  <tr style={{ fontSize: '0.7rem', opacity: 0.75 }}>
                    <td>{t('smartPlanner.applyAll', 'Tous')} →</td>
                    {['midi', 'soir'].map((sv) => (
                      <td key={sv} style={{ textAlign: 'center' }}>
                        {[50, 100, 130].map((p) => (
                          <button key={p} type="button" className="secondary"
                                  onClick={() => setAll(sv, p)}
                                  style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem', margin: '0 0.1rem' }}>
                            {(p/100).toFixed(1)}
                          </button>
                        ))}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dateRange(from, to).map((date) => {
                    const dow = new Date(date).getDay();
                    const wdayShort = new Date(date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
                    return (
                      <tr key={date}>
                        <td style={{ padding: '0.2rem 0' }}>{wdayShort}</td>
                        {['midi', 'soir'].map((sv) => {
                          const v = perCell[date]?.[sv] ?? 100;
                          const color = v >= 130 ? 'var(--danger)' : v >= 100 ? 'var(--success)' : 'var(--info)';
                          return (
                            <td key={sv} style={{ textAlign: 'center', padding: '0.2rem 0.3rem' }}>
                              <input
                                type="number" min={0} max={200} step={10}
                                value={v}
                                onChange={(e) => setCell(date, sv, Number(e.target.value))}
                                style={{
                                  width: 55, padding: '0.2rem 0.3rem', fontSize: '0.78rem',
                                  color, fontWeight: 600, textAlign: 'center',
                                  border: `1px solid ${color}`,
                                }}
                                title={`${(v/100).toFixed(2)}`}
                              />
                              <span style={{ marginLeft: '0.2rem', fontSize: '0.65rem', opacity: 0.65 }}>{(v/100).toFixed(2)}</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                        <span style={{ color, fontWeight: 600, minWidth: 90, textAlign: 'right', fontFamily: 'monospace' }}>
                          {(c.actual_coef/100).toFixed(2)} / {(c.ideal/100).toFixed(2)} ({pct}%)
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
