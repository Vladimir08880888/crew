import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statsApi } from '../api/stats.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFamily } from '../context/FamilyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus.js';
import ParentDashboard from './ParentDashboard.jsx';
import ChildDashboard from './ChildDashboard.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { active } = useFamily();
  const toast = useToast();
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    statsApi.dashboard().then(setData).catch(toast.fromError);
  }, []);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  if (!data) return <p className="muted">{t('common.loading')}</p>;

  if (!active) {
    return (
      <div className="empty-state">
        <div className="empty-icon">👋</div>
        <h3>{t('dashboard.welcomeTitle', { name: user.first_name })}</h3>
        <p>{t('dashboard.welcomeHint')}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to="/teams/new"><button><Plus size={16} /> {t('dashboard.createTeam')}</button></Link>
          <Link to="/teams/join"><button className="secondary"><Users size={16} /> {t('dashboard.join')}</button></Link>
        </div>
      </div>
    );
  }

  return active.role === 'parent'
    ? <ParentDashboard data={data} user={user} family={active} />
    : <ChildDashboard data={data} user={user} family={active} />;
}
