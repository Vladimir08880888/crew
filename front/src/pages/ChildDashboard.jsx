import { useTranslation } from 'react-i18next';
import { UpcomingShifts } from '../components/dashboard/UpcomingShifts.jsx';

export default function ChildDashboard({ user, family }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('dashboard.childGreeting', { name: user.first_name })}</h1>
          <p className="muted">{t('dashboard.childIntro')} <b>{family.name}</b>.</p>
        </div>
      </div>

      <UpcomingShifts />
    </>
  );
}
