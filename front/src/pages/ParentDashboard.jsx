import { Link } from 'react-router-dom';
import { CalendarDays, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UpcomingShifts } from '../components/dashboard/UpcomingShifts.jsx';

function initials(first, last) {
  return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
}

function hoursColor(planned, target) {
  if (!target) return 'var(--text-muted)';
  const ratio = planned / target;
  if (ratio < 0.85) return 'var(--warning)';
  if (ratio > 1.1)  return 'var(--danger)';
  return 'var(--success)';
}

function MemberHoursGrid({ members }) {
  const { t } = useTranslation();
  if (!members || members.length === 0) return null;
  return (
    <>
      <h2>{t('dashboard.hoursThisWeek')}</h2>
      <div className="member-grid">
        {members.map((m) => {
          const target = m.weekly_hours_target;
          const color = hoursColor(m.hours_planned, target);
          return (
            <div className="card member-stat-card" key={m.user_id}>
              <div className="row" style={{ gap: '0.75rem' }}>
                <span className="member-avatar">{initials(m.first_name, m.last_name)}</span>
                <div className="col" style={{ gap: '0.1rem', flex: 1 }}>
                  <b>{m.first_name} {m.last_name}</b>
                  <div className="row" style={{ flexWrap: 'wrap', gap: '0.3rem' }}>
                    {m.poste && (
                      <span className="role-tag">{t(`postes.${m.poste}`, m.poste)}</span>
                    )}
                    {m.is_admin && (
                      <span className="role-tag admin"><Shield size={10} /> {t('roles.admin')}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="member-stat-row" style={{ marginTop: '0.5rem' }}>
                <div className="member-stat" style={{ flex: 1 }}>
                  <span className="member-stat-value" style={{ color }}>
                    {m.hours_planned}h
                    {target != null && <span style={{ fontSize: '0.7em', opacity: 0.6 }}> / {target}h</span>}
                  </span>
                  <span className="member-stat-label">{t('dashboard.weekHours')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function ParentDashboard({ data, user, family }) {
  const { t } = useTranslation();
  const activeFamily = data.families?.find((f) => f.id === family.id);
  const breakdown = activeFamily?.breakdown || [];

  const totalPlanned  = breakdown.reduce((acc, m) => acc + (m.hours_planned || 0), 0);
  const totalTarget   = breakdown.reduce((acc, m) => acc + (m.weekly_hours_target || 0), 0);
  const undercoverage = breakdown.filter((m) => (m.weekly_hours_target || 0) > 0 && m.hours_planned < m.weekly_hours_target * 0.85).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👥 {family.name}</h1>
          <p className="muted">{t('dashboard.parentGreeting', { name: user.first_name })}</p>
        </div>
        <Link to="/planning">
          <button><Sparkles size={16} /> {t('dashboard.openPlanning')}</button>
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3><CalendarDays size={14} style={{ verticalAlign: '-2px' }} /> {t('dashboard.hoursPlanned')}</h3>
          <div className="stat-value">{totalPlanned}h</div>
          {totalTarget > 0 && (
            <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }}>
              {t('dashboard.outOfTarget', { target: totalTarget })}
            </p>
          )}
        </div>
        <div className={`stat-card ${undercoverage > 0 ? 'warning' : 'success'}`}>
          <h3><AlertCircle size={14} style={{ verticalAlign: '-2px' }} /> {t('dashboard.undercoverage')}</h3>
          <div className="stat-value">{undercoverage}</div>
        </div>
        <div className="stat-card">
          <h3>{t('dashboard.activeMembers')}</h3>
          <div className="stat-value">{breakdown.length}</div>
        </div>
      </div>

      <UpcomingShifts />

      <MemberHoursGrid members={breakdown} />
    </>
  );
}
