import { useTranslation } from 'react-i18next';
import { UpcomingShifts } from '../components/dashboard/UpcomingShifts.jsx';

export default function EquipierDashboard({ user, team }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('dashboard.equipierGreeting', { name: user.first_name })}</h1>
          <p className="muted">{t('dashboard.equipierIntro')} <b>{team.name}</b>.</p>
        </div>
      </div>

      <UpcomingShifts />
    </>
  );
}
