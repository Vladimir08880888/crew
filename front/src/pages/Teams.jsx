import { Link } from 'react-router-dom';
import { Users, Shield, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTeam } from '../context/TeamContext.jsx';

export default function Teams() {
  const { teams } = useTeam();
  const { t } = useTranslation();

  return (
    <>
      <div className="page-header">
        <h1>{t('teams.title')}</h1>
        {/* Pas de bouton « Créer une équipe » : la création se fait
            au moment de l'inscription (choix « Patron de restaurant »).
            Le bouton « Rejoindre » reste pour les rares cas où un
            manager est invité comme co-manager sur une autre équipe. */}
        <div className="row">
          <Link to="/teams/join"><button className="secondary"><Users size={16} /> {t('teams.join')}</button></Link>
        </div>
      </div>

      {teams.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👨‍👩‍👧</div>
          <h3>{t('teams.empty')}</h3>
          <p>{t('teams.emptyHint')}</p>
        </div>
      )}

      <ul className="team-list">
        {teams.map((f) => (
          <li key={f.id}>
            <Link to={`/teams/${f.id}`}><h3>{f.name}</h3></Link>
            <div className="row" style={{ flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              <span className={`role-tag ${f.role}`}>{t(`roles.${f.role}`)}</span>
              {f.is_admin && <span className="role-tag admin"><Shield size={10} /> {t('roles.admin')}</span>}
              {f.status === 'pending' && (
                <span className="role-tag" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                  <Clock size={10} /> {t('teams.statusPending')}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
