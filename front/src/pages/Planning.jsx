import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Calendar, Trash2, Sparkles, Copy, Eraser, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shiftsApi } from '../api/shifts.api.js';
import { familiesApi } from '../api/families.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFamily } from '../context/FamilyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus.js';
import { POSTES, SHIFTS } from '../utils/enums.js';
import { ShiftFormModal } from '../components/planning/ShiftFormModal.jsx';
import { SmartPlannerModal } from '../components/planning/SmartPlannerModal.jsx';

const DAYS_SHORT_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** Lundi de la semaine qui contient `date` (locale FR). */
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function fmt(date) {
  return `${DAYS_SHORT_FR[date.getDay()]} ${date.getDate()}`;
}

export default function Planning() {
  const { user } = useAuth();
  const { active } = useFamily();
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useTranslation();

  const [weekStart, setWeekStart] = useState(mondayOf(new Date()));
  const [shifts, setShifts] = useState([]);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { date, user_id, shift, ... } or null
  const [showSmart, setShowSmart] = useState(false);
  const [draggedShift, setDraggedShift] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  const isManager = active?.role === 'parent';

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const from = iso(weekDays[0]);
  const to   = iso(weekDays[6]);

  // Tri par groupe de poste : cuisine (+plonge) puis salle, autres en fin.
  const POSTE_GROUP = { cuisine: 'cuisine', plonge: 'cuisine', salle: 'salle' };
  const POSTE_ORDER = ['cuisine', 'salle', 'other'];
  function groupOf(poste) { return POSTE_GROUP[poste] || 'other'; }
  const sortedMembers = useMemo(() => {
    const score = (g) => POSTE_ORDER.indexOf(g);
    return [...members].sort((a, b) => {
      const ga = score(groupOf(a.poste));
      const gb = score(groupOf(b.poste));
      if (ga !== gb) return ga - gb;
      return (a.first_name || '').localeCompare(b.first_name || '');
    });
  }, [members]);

  // Index couverture par (group, date, service) → { actual, ideal }.
  const coverageIndex = useMemo(() => {
    const idx = {};
    for (const c of summary?.coverage || []) {
      const g = groupOf(c.poste);
      const key = `${g}|${c.date}|${c.service}`;
      idx[key] = c;
    }
    return idx;
  }, [summary]);

  // Index santé service par (date, service).
  const healthIndex = useMemo(() => {
    const idx = {};
    for (const h of summary?.serviceHealth || []) {
      idx[`${h.date}|${h.service}`] = h;
    }
    return idx;
  }, [summary]);

  // Index couverture globale moyenne (cuisine+salle/2) par (date, service).
  const overallIndex = useMemo(() => {
    const idx = {};
    for (const o of summary?.overallService || []) {
      idx[`${o.date}|${o.service}`] = o;
    }
    return idx;
  }, [summary]);

  // Slots nécessitant un extra (sous l'idéal ET densité ≥ 100 %).
  // Pour l'instant on signale TOUT slot sous-idéal — le seuil sera affiné
  // si besoin par jour. coverage est rempli par le back en fonction de la
  // capacité courante (par défaut 100 %).
  const extrasNeeded = useMemo(() => {
    return (summary?.coverage || []).filter((c) => c.actual_coef < c.ideal);
  }, [summary]);

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return; }
    setLoading(true);
    try {
      const [shiftsData, fam, summaryData] = await Promise.all([
        shiftsApi.list({ family_id: active.id, from, to }),
        familiesApi.detail(active.id),
        isManager ? shiftsApi.summary({ family_id: active.id, from, to }) : Promise.resolve(null),
      ]);
      setShifts(shiftsData);
      setMembers((fam.members || []).filter((m) => m.status === 'active'));
      setSummary(summaryData);
    } catch (err) {
      toast.fromError(err);
    } finally {
      setLoading(false);
    }
  }, [active?.id, from, to, isManager]);

  function memberStats(userId) {
    return summary?.memberStats?.find((m) => m.user_id === userId);
  }

  async function cloneFromLastWeek() {
    const srcStart = addDays(weekStart, -7);
    const ok = await confirm({
      title: t('smartPlanner.cloneTitle'),
      message: t('smartPlanner.cloneMessage'),
      confirmLabel: t('smartPlanner.cloneConfirm'),
    });
    if (!ok) return;
    try {
      const r = await shiftsApi.cloneWeek({
        family_id: active.id,
        source_from: iso(srcStart),
        source_to: iso(addDays(srcStart, 6)),
        target_from: from,
      });
      toast.success(t('smartPlanner.cloneToast', { n: r.created, skipped: r.skipped }));
      load();
    } catch (err) { toast.fromError(err); }
  }

  async function clearWeek() {
    const ok = await confirm({
      title: t('smartPlanner.clearTitle'),
      message: t('smartPlanner.clearMessage'),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      const r = await shiftsApi.clearWeek({ family_id: active.id, from, to });
      toast.success(t('smartPlanner.clearedToast', { n: r.deleted }));
      load();
    } catch (err) { toast.fromError(err); }
  }

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  if (!active) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Calendar size={48} /></div>
        <h3>{t('planning.title')}</h3>
        <p>{t('planning.selectEstablishment')}</p>
      </div>
    );
  }

  function shiftsAt(dateStr, userId) {
    return shifts.filter((s) => s.date.startsWith(dateStr) && s.user_id === userId);
  }

  function openCreate(dateStr, member) {
    if (!isManager) return;
    setEditing({
      family_id: active.id,
      user_id: member.user_id,
      memberName: `${member.first_name} ${member.last_name}`,
      date: dateStr,
      shift_type: member.shift_default || 'midi',
      poste: member.poste || 'salle',
    });
  }

  function openEdit(shift) {
    if (!isManager) return;
    const member = members.find((m) => m.user_id === shift.user_id);
    setEditing({
      id: shift.id,
      family_id: active.id,
      user_id: shift.user_id,
      memberName: `${shift.first_name} ${shift.last_name}`,
      date: shift.date.slice(0, 10),
      shift_type: shift.shift_type,
      poste: shift.poste,
      note: shift.note,
      start_time: shift.start_time,
      end_time: shift.end_time,
    });
  }

  async function deleteShift(shift) {
    const ok = await confirm({
      title: t('planning.deleteTitle'),
      message: t('planning.deleteMessage', {
        name: `${shift.first_name}`,
        type: t(`shifts.${shift.shift_type}`),
        date: new Date(shift.date).toLocaleDateString('fr-FR'),
      }),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      await shiftsApi.remove(shift.id);
      toast.success(t('planning.deleted'));
      load();
    } catch (err) {
      toast.fromError(err);
    }
  }

  async function moveShift(shift, newDate, newUserId) {
    if (shift.date.slice(0, 10) === newDate && shift.user_id === newUserId) return;
    // Optimistic update
    const prev = shifts;
    setShifts(shifts.map((s) => (s.id === shift.id ? { ...s, date: newDate, user_id: newUserId } : s)));
    try {
      await shiftsApi.update(shift.id, { date: newDate, user_id: newUserId });
      load();
    } catch (err) {
      setShifts(prev);
      toast.fromError(err);
    }
  }

  async function saveShift(data) {
    try {
      if (data.id) {
        await shiftsApi.update(data.id, data);
        toast.success(t('planning.updated'));
      } else {
        await shiftsApi.create(data);
        toast.success(t('planning.created'));
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.fromError(err);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('planning.title')}</h1>
        <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
          <button className="ghost icon-only" onClick={() => setWeekStart(addDays(weekStart, -7))} title={t('planning.prevWeek')}>
            <ChevronLeft size={18} />
          </button>
          <button className="secondary" onClick={() => setWeekStart(mondayOf(new Date()))}>
            {t('planning.thisWeek')}
          </button>
          <button className="ghost icon-only" onClick={() => setWeekStart(addDays(weekStart, 7))} title={t('planning.nextWeek')}>
            <ChevronRight size={18} />
          </button>
          {isManager && (
            <>
              <button onClick={() => setShowSmart(true)} title={t('smartPlanner.tooltip')}>
                <Sparkles size={14} /> {t('smartPlanner.button')}
              </button>
              <button className="secondary" onClick={cloneFromLastWeek} title={t('smartPlanner.cloneTooltip')}>
                <Copy size={14} />
              </button>
              <button className="ghost icon-only" onClick={clearWeek} title={t('smartPlanner.clearTooltip')}>
                <Eraser size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerte science-based : surcharge soutenue (KC & Terwiesch 2009) */}
      {isManager && summary?.fatigueAlerts?.length > 0 && (
        <div className="card" style={{
          marginTop: '0.5rem',
          borderLeft: '4px solid var(--danger)',
          background: 'rgba(239,68,68,0.08)',
        }}>
          <div className="row" style={{ gap: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            <b>{t('planning.fatigueTitle', 'Surcharge soutenue détectée')}</b>
          </div>
          {summary.fatigueAlerts.map((a, i) => (
            <div key={i} style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
              <div>{a.date && <b>{new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })} — </b>}{a.reason}</div>
              <div className="muted" style={{ fontSize: '0.72rem', fontStyle: 'italic' }}>📚 {a.citation}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alerte conformité HCR */}
      {isManager && summary?.hcrViolations?.length > 0 && (
        <div className="card" style={{
          marginTop: '0.5rem',
          borderLeft: '4px solid var(--danger)',
          background: 'rgba(239,68,68,0.08)',
        }}>
          <div className="row" style={{ gap: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            <b>{t('planning.hcrTitle', 'Non-conformités HCR / santé au travail')}</b>
          </div>
          {summary.hcrViolations.slice(0, 6).map((v, i) => (
            <div key={i} style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
              <div><b>{v.name} : </b>{v.reason}</div>
              <div className="muted" style={{ fontSize: '0.72rem', fontStyle: 'italic' }}>📚 {v.citation}</div>
            </div>
          ))}
          {summary.hcrViolations.length > 6 && (
            <div className="muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>+ {summary.hcrViolations.length - 6} autres</div>
          )}
        </div>
      )}

      {/* Alerte « extras nécessaires » : créneaux sous l'idéal */}
      {isManager && extrasNeeded.length > 0 && (
        <div className="card" style={{
          marginTop: '0.5rem',
          borderLeft: '4px solid var(--warning)',
          background: 'var(--warning-bg)',
        }}>
          <div className="row" style={{ gap: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <b>{t('planning.extrasAlertTitle', { n: extrasNeeded.length, defaultValue: '{{n}} créneaux nécessitent un extra cette semaine' })}</b>
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.85rem' }}>
            {extrasNeeded.slice(0, 8).map((c, i) => {
              const deficit = c.ideal - c.actual_coef;
              return (
                <span key={i} className="tag">
                  {new Date(c.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                  {' '}{t(`shifts.${c.service}`)} {t(`postes.${groupOf(c.poste)}`)} <b>+{deficit}</b>
                </span>
              );
            })}
            {extrasNeeded.length > 8 && <span className="muted">+ {extrasNeeded.length - 8}</span>}
          </div>
        </div>
      )}

      <p className="muted">
        {t('planning.weekRange', {
          from: weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
          to:   weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        })}
        {isManager && summary?.laborCostTotal != null && (
          <span style={{ marginLeft: '0.75rem' }}>
            · 💶 {t('planning.laborCost', 'Masse salariale')} :{' '}
            <b>{summary.laborCostTotal.toFixed(2)} €</b>
          </span>
        )}
      </p>

      {loading && <p className="muted">{t('common.loading')}</p>}

      {!loading && (
        <div className="planning-grid-wrap">
          <table className="planning-grid">
            <thead>
              <tr>
                <th>{t('planning.member')}</th>
                {weekDays.map((d) => {
                  const dateStr = iso(d);
                  const hMidi = healthIndex[`${dateStr}|midi`];
                  const hSoir = healthIndex[`${dateStr}|soir`];
                  const dot = (h) => {
                    if (!h) return null;
                    const c = h.level === 'saine' ? 'var(--success)'
                            : h.level === 'tendue' ? 'var(--warning)'
                            : 'var(--danger)';
                    return (
                      <span title={`${h.service} ${h.level} (${h.score}/100, ${h.load_pct}%)`}
                            style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, margin: '0 1px' }} />
                    );
                  };
                  const oMidi = overallIndex[`${dateStr}|midi`];
                  const oSoir = overallIndex[`${dateStr}|soir`];
                  return (
                    <th key={dateStr} className={dateStr === iso(new Date()) ? 'today' : ''}>
                      <div>{fmt(d)}</div>
                      {(hMidi || hSoir) && (
                        <div style={{ fontSize: '0.65rem', marginTop: '0.1rem', opacity: 0.9 }}>
                          {dot(hMidi)} {dot(hSoir)}
                        </div>
                      )}
                      {(oMidi || oSoir) && (
                        <div style={{ fontSize: '0.65rem', marginTop: '0.1rem', opacity: 0.85, fontFamily: 'monospace' }}>
                          {oMidi && <span title={t('planning.midiCoverage', 'Couverture midi (moyenne cuisine+salle)')}>M {(oMidi.avg_pct/100).toFixed(2)}</span>}
                          {oMidi && oSoir && ' / '}
                          {oSoir && <span title={t('planning.soirCoverage', 'Couverture soir (moyenne cuisine+salle)')}>S {(oSoir.avg_pct/100).toFixed(2)}</span>}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((m, idx) => {
                const stats = memberStats(m.user_id);
                const statusColor =
                  stats?.status === 'over'  ? 'var(--danger)'
                  : stats?.status === 'under' ? 'var(--warning)'
                  : stats?.status === 'ok'    ? 'var(--success)'
                  : 'var(--text-muted)';
                const myGroup = groupOf(m.poste);
                const prevGroup = idx > 0 ? groupOf(sortedMembers[idx - 1].poste) : null;
                const nextGroup = idx < sortedMembers.length - 1 ? groupOf(sortedMembers[idx + 1].poste) : null;
                const isFirstOfGroup = prevGroup !== myGroup;
                const isLastOfGroup = nextGroup !== myGroup;
                return (
                <Fragment key={m.user_id}>
                {isFirstOfGroup && (
                  <tr key={`hdr-${myGroup}`} className="poste-group-header">
                    <td colSpan={weekDays.length + 1} style={{
                      background: 'var(--bg-soft, rgba(0,0,0,0.04))',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      padding: '0.4rem 0.6rem',
                    }}>
                      {myGroup === 'cuisine' ? '🍳 ' : myGroup === 'salle' ? '🍽️ ' : ''}
                      {t(`postes.${myGroup}`, myGroup)}
                    </td>
                  </tr>
                )}
                <tr key={m.user_id}>
                  <td className="member-cell">
                    <b>{m.first_name}</b>
                    {m.poste && <span className="role-tag" style={{ marginLeft: '0.4rem' }}>{t(`postes.${m.poste}`, m.poste)}</span>}
                    {stats && stats.target > 0 && (
                      <div style={{ fontSize: '0.72rem', color: statusColor, marginTop: '0.2rem', fontWeight: 600 }}>
                        {stats.planned}h / {stats.target}h
                      </div>
                    )}
                  </td>
                  {weekDays.map((d) => {
                    const dateStr = iso(d);
                    const cellShifts = shiftsAt(dateStr, m.user_id);
                    const cellKey = `${m.user_id}-${dateStr}`;
                    const canDropHere = isManager && draggedShift && cellShifts.length < 2 &&
                      !(draggedShift.user_id === m.user_id && draggedShift.date.slice(0, 10) === dateStr);
                    return (
                      <td
                        key={dateStr}
                        className={`planning-cell ${canDropHere && dragOverKey === cellKey ? 'drop-target' : ''}`}
                        onDragOver={(e) => {
                          if (canDropHere) { e.preventDefault(); setDragOverKey(cellKey); }
                        }}
                        onDragLeave={() => setDragOverKey((k) => (k === cellKey ? null : k))}
                        onDrop={(e) => {
                          if (!canDropHere) return;
                          e.preventDefault();
                          setDragOverKey(null);
                          moveShift(draggedShift, dateStr, m.user_id);
                          setDraggedShift(null);
                        }}
                      >
                        {cellShifts.map((s) => (
                          <div
                            key={s.id}
                            className={`shift-pill shift-${s.shift_type} ${isManager ? 'clickable draggable' : ''} ${draggedShift?.id === s.id ? 'dragging' : ''}`}
                            draggable={isManager}
                            onDragStart={(e) => {
                              setDraggedShift(s);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => { setDraggedShift(null); setDragOverKey(null); }}
                            onClick={() => isManager && openEdit(s)}
                            title={s.note || ''}
                          >
                            <span>{t(`shifts.${s.shift_type}`, s.shift_type)}</span>
                            <span className="shift-poste">{t(`postes.${s.poste}`, s.poste)}</span>
                            {isManager && (
                              <button
                                className="shift-del"
                                onClick={(e) => { e.stopPropagation(); deleteShift(s); }}
                                title={t('common.delete')}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        ))}
                        {isManager && cellShifts.length < 2 && (
                          <button className="shift-add" onClick={() => openCreate(dateStr, m)} title={t('planning.addShift')}>
                            <Plus size={12} />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {isLastOfGroup && isManager && (
                  <tr key={`extras-${myGroup}`} className="extras-row">
                    <td className="member-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <b>{t('planning.extras', 'Extras')}</b>
                      <div style={{ fontSize: '0.7rem', marginTop: '0.15rem' }}>{t('planning.extrasHint', 'manque sur ce poste')}</div>
                    </td>
                    {weekDays.map((d) => {
                      const dateStr = iso(d);
                      const midi = coverageIndex[`${myGroup}|${dateStr}|midi`];
                      const soir = coverageIndex[`${myGroup}|${dateStr}|soir`];
                      const items = [midi, soir].filter((c) => c && c.actual_coef < c.ideal);
                      return (
                        <td key={dateStr} className="planning-cell">
                          {items.length === 0 && (midi || soir) && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--success)', opacity: 0.7 }}>✓</div>
                          )}
                          {items.map((c) => {
                            const deficit = c.ideal - c.actual_coef;
                            return (
                              <div key={c.service} className="extra-ghost" title={t('planning.extraTitle', { service: t(`shifts.${c.service}`), deficit })}>
                                <span style={{ fontWeight: 600 }}>+{deficit}</span>
                                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{t(`shifts.${c.service}`, c.service)}</span>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ShiftFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={saveShift}
        />
      )}

      {showSmart && (
        <SmartPlannerModal
          familyId={active.id}
          from={from}
          to={to}
          onClose={() => setShowSmart(false)}
          onApplied={() => { setShowSmart(false); load(); }}
        />
      )}
    </>
  );
}
