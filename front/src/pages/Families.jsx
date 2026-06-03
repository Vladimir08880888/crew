import { Link } from 'react-router-dom';
import { Plus, Users, Shield, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../context/FamilyContext.jsx';

export default function Families() {
  const { families } = useFamily();
  const { t } = useTranslation();

  return (
    <>
      <div className="page-header">
        <h1>{t('families.title')}</h1>
        <div className="row">
          <Link to="/teams/new"><button><Plus size={16} /> {t('families.create')}</button></Link>
          <Link to="/teams/join"><button className="secondary"><Users size={16} /> {t('families.join')}</button></Link>
        </div>
      </div>

      {families.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👨‍👩‍👧</div>
          <h3>{t('families.empty')}</h3>
          <p>{t('families.emptyHint')}</p>
        </div>
      )}

      <ul className="family-list">
        {families.map((f) => (
          <li key={f.id}>
            <Link to={`/teams/${f.id}`}><h3>{f.name}</h3></Link>
            <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              <span className={`role-tag ${f.role}`}>{t(`roles.${f.role}`)}</span>
              {f.is_admin && <span className="role-tag admin"><Shield size={10} /> {t('roles.admin')}</span>}
              {f.status === 'pending' && (
                <span className="role-tag" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                  <Clock size={10} /> {t('families.statusPending')}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
