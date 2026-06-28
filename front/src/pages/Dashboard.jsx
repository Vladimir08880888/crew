import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statsApi } from '../api/stats.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTeam } from '../context/TeamContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus.js';
import ManagerDashboard from './ManagerDashboard.jsx';
import EquipierDashboard from './EquipierDashboard.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { active, teams, reload } = useTeam();
  const toast = useToast();
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    statsApi.dashboard().then(setData).catch(toast.fromError);
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);
  // À chaque focus de l'onglet, recharger les équipes — si le manager
  // vient d'approuver la demande pendant que l'écran restait ouvert,
  // l'utilisateur bascule automatiquement sur son interface équipier.
  useRefetchOnFocus(reload);

  if (!data) return <p className="muted">{t('common.loading')}</p>;

  if (!active) {
    // Cas particulier : l'utilisateur a déjà saisi un code mais
    // attend l'approbation du manager. On affiche un état explicite
    // au lieu de l'état vide « bienvenue ».
    const pending = teams.filter((f) => f.status === 'pending');
    if (pending.length > 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon"><Clock size={48} /></div>
          <h3>{t('dashboard.pendingTitle')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 1rem' }}>
            {pending.map((f) => (
              <li key={f.id} style={{ fontWeight: 600 }}>{f.name}</li>
            ))}
          </ul>
          <p>{t('dashboard.pendingHint')}</p>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            {t('dashboard.pendingRefreshHint')}
          </p>
        </div>
      );
    }
    return (
      <div className="empty-state">
        <div className="empty-icon">👋</div>
        <h3>{t('dashboard.welcomeTitle', { name: user.first_name })}</h3>
        <p>{t('dashboard.welcomeHint')}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to="/teams/join">
            <button><Users size={16} /> {t('dashboard.join')}</button>
          </Link>
        </div>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
          {t('dashboard.ownerHint')}
        </p>
      </div>
    );
  }

  return active.role === 'manager'
    ? <ManagerDashboard data={data} user={user} team={active} />
    : <EquipierDashboard data={data} user={user} team={active} />;
}
