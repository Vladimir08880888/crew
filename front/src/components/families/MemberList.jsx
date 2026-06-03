import { Check, X, Pencil, KeyRound, Briefcase, Clock, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function initials(first, last) {
  return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
}

const POSTE_EMOJI = {
  cuisine:        '🍳',
  salle:          '🍽️',
  bar:            '🍷',
  plonge:         '🧽',
  administration: '📋',
};

/**
 * Liste des membres d'une équipe.
 *
 * Pour chaque membre actif, on affiche en plus du rôle :
 *   - Poste (avec emoji visuel)
 *   - Shift habituel
 *   - Heures hebdo cibles (badge bleu si défini, gris « non configuré » sinon)
 *
 * Quand l'admin ouvre la fiche d'un membre dont le setup est incomplet
 * (pas de poste ou pas d'heures cibles), un liseré orange attire son
 * attention et il sait que le solver d'auto-planning va l'ignorer.
 */
export function MemberList({ members, currentUserId, isAdmin, onApprove, onUpdate, onRemove, onResetPassword }) {
  const { t } = useTranslation();
  const active = members.filter((m) => m.status === 'active');
  const pending = members.filter((m) => m.status === 'pending');

  function isSetupIncomplete(m) {
    return !m.poste || m.weekly_hours_target == null;
  }

  return (
    <>
      <h3>{t('memberList.membersHeading', { count: active.length })}</h3>
      <ul className="member-list">
        {active.map((m) => {
          const incomplete = isSetupIncomplete(m) && m.role === 'child';
          return (
            <li key={m.user_id} className={incomplete ? 'member-card-incomplete' : ''}>
              <div className="member-info">
                <span className="member-avatar">{initials(m.first_name, m.last_name)}</span>
                <div className="col" style={{ gap: '0.25rem' }}>
                  <b>{m.first_name} {m.last_name}</b>
                  <div className="row" style={{ flexWrap: 'wrap', gap: '0.3rem' }}>
                    <span className={`role-tag ${m.role}`}>{t(`roles.${m.role}`)}</span>
                    {m.is_admin && <span className="role-tag admin">{t('roles.admin')}</span>}
                    {m.user_id === currentUserId && <span className="role-tag you">{t('roles.you')}</span>}
                  </div>
                  <div className="row" style={{ flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.15rem' }}>
                    {m.poste && (
                      <span className="role-tag">
                        {POSTE_EMOJI[m.poste] || <Briefcase size={10} />} {t(`postes.${m.poste}`, m.poste)}
                      </span>
                    )}
                    {m.shift_default && (
                      <span className="role-tag">
                        <Clock size={10} /> {t(`shifts.${m.shift_default}`, m.shift_default)}
                      </span>
                    )}
                    {m.weekly_hours_target != null && (
                      <span className="role-tag" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                        <Hash size={10} /> {m.weekly_hours_target}h/sem
                      </span>
                    )}
                    {m.level && (() => {
                      // Derive profile label from (level, coef_override).
                      const c = m.coef_override;
                      let key;
                      if (m.level === 'junior' && c === 50) key = 'apprenti';
                      else if (m.level === 'junior' && c === 75) key = 'debutant';
                      else if (m.level === 'confirme' && c === 100) key = 'autonome';
                      else if (m.level === 'confirme' && c === 125) key = 'pilier';
                      else if (m.level === 'chef' && c === 150) key = 'referent';
                      else key = m.level === 'chef' ? 'referent' : m.level === 'junior' ? 'apprenti' : 'autonome';
                      const ico = key === 'apprenti' ? '🌱' : key === 'debutant' ? '🌿' : key === 'autonome' ? '🌳' : key === 'pilier' ? '⭐' : '👑';
                      const style = key === 'referent' || key === 'pilier'
                        ? { background: 'rgba(99,102,241,0.18)', color: 'var(--primary)' }
                        : key === 'apprenti' || key === 'debutant'
                        ? { background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }
                        : { background: 'rgba(16,185,129,0.15)', color: 'var(--success)' };
                      return (
                        <span className="role-tag" style={style}>
                          {ico} {t(`profiles.${key}`, key)}
                        </span>
                      );
                    })()}
                    {incomplete && (
                      <span className="role-tag" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>
                        ⚠ {t('memberList.setupIncomplete')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isAdmin && m.user_id !== currentUserId && (
                <div className="row">
                  <button
                    className={incomplete ? '' : 'ghost icon-only'}
                    onClick={() => onUpdate(m)}
                    title={t('memberList.editRoleTitle')}
                  >
                    <Pencil size={14} />
                    {incomplete && <span style={{ marginLeft: 4 }}>{t('memberList.setupCta')}</span>}
                  </button>
                  <button className="ghost icon-only" onClick={() => onResetPassword(m)} title={t('memberList.resetPasswordTitle')}>
                    <KeyRound size={14} />
                  </button>
                  <button className="danger icon-only" onClick={() => onRemove(m)} title={t('memberList.removeTitle')}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {pending.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>{t('memberList.pendingHeading', { count: pending.length })}</h3>
          <ul className="member-list">
            {pending.map((m) => (
              <li key={m.user_id}>
                <div className="member-info">
                  <span className="member-avatar">{initials(m.first_name, m.last_name)}</span>
                  <div className="col" style={{ gap: '0.1rem' }}>
                    <b>{m.first_name} {m.last_name}</b>
                    <span className="muted" style={{ fontSize: '0.8rem' }}>{m.email}</span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button onClick={() => onApprove(m, 'parent')}>
                      <Check size={14} /> {t('memberList.approveParent')}
                    </button>
                    <button className="secondary" onClick={() => onApprove(m, 'child')}>
                      <Check size={14} /> {t('memberList.approveChild')}
                    </button>
                    <button className="danger icon-only" onClick={() => onRemove(m)} title={t('memberList.rejectTitle')}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
