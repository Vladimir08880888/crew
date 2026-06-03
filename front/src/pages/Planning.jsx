import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const isManager = active?.role === 'parent';

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const from = iso(weekDays[0]);
  const to   = iso(weekDays[6]);

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

      {/* Couverture warnings */}
      {isManager && summary?.coverageGaps?.length > 0 && (
        <div className="card" style={{
          marginTop: '0.5rem',
          borderLeft: '4px solid var(--warning)',
          background: 'var(--warning-bg)',
        }}>
          <div className="row" style={{ gap: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <b>{t('smartPlanner.gapsTitle', { n: summary.coverageGaps.length })}</b>
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.85rem' }}>
            {summary.coverageGaps.slice(0, 6).map((g, i) => (
              <span key={i} className="tag">
                {new Date(g.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                {' '}{t(`shifts.${g.shift_type}`)} {t(`postes.${g.poste}`)}
              </span>
            ))}
            {summary.coverageGaps.length > 6 && <span className="muted">+ {summary.coverageGaps.length - 6}</span>}
          </div>
        </div>
      )}

      <p className="muted">
        {t('planning.weekRange', {
          from: weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
          to:   weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        })}
      </p>

      {loading && <p className="muted">{t('common.loading')}</p>}

      {!loading && (
        <div className="planning-grid-wrap">
          <table className="planning-grid">
            <thead>
              <tr>
                <th>{t('planning.member')}</th>
                {weekDays.map((d) => (
                  <th key={iso(d)} className={iso(d) === iso(new Date()) ? 'today' : ''}>
                    {fmt(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const stats = memberStats(m.user_id);
                const statusColor =
                  stats?.status === 'over'  ? 'var(--danger)'
                  : stats?.status === 'under' ? 'var(--warning)'
                  : stats?.status === 'ok'    ? 'var(--success)'
                  : 'var(--text-muted)';
                return (
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
                    return (
                      <td key={dateStr} className="planning-cell">
                        {cellShifts.map((s) => (
                          <div
                            key={s.id}
                            className={`shift-pill shift-${s.shift_type} ${isManager ? 'clickable' : ''}`}
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
