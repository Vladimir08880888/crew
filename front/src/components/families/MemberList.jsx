import { Check, X, Pencil, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function initials(first, last) {
  return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
}

export function MemberList({ members, currentUserId, isAdmin, onApprove, onUpdate, onRemove, onResetPassword }) {
  const { t } = useTranslation();
  const active = members.filter((m) => m.status === 'active');
  const pending = members.filter((m) => m.status === 'pending');

  return (
    <>
      <h3>{t('memberList.membersHeading', { count: active.length })}</h3>
      <ul className="member-list">
        {active.map((m) => (
          <li key={m.user_id}>
            <div className="member-info">
              <span className="member-avatar">{initials(m.first_name, m.last_name)}</span>
              <div className="col" style={{ gap: '0.1rem' }}>
                <b>{m.first_name} {m.last_name}</b>
                <div className="row" style={{ flexWrap: 'wrap', gap: '0.3rem' }}>
                  <span className={`role-tag ${m.role}`}>{t(`roles.${m.role}`)}</span>
                  {m.is_admin && <span className="role-tag admin">{t('roles.admin')}</span>}
                  {m.poste && <span className="role-tag" title={t(`postes.${m.poste}`, m.poste)}>🍴 {t(`postes.${m.poste}`, m.poste)}</span>}
                  {m.shift_default && <span className="role-tag" title={t(`shifts.${m.shift_default}`, m.shift_default)}>⏰ {t(`shifts.${m.shift_default}`, m.shift_default)}</span>}
                  {m.user_id === currentUserId && <span className="role-tag you">{t('roles.you')}</span>}
                </div>
              </div>
            </div>
            {isAdmin && m.user_id !== currentUserId && (
              <div className="row">
                <button className="ghost icon-only" onClick={() => onUpdate(m)} title={t('memberList.editRoleTitle')}>
                  <Pencil size={14} />
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
        ))}
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
