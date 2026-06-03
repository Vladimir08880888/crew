import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="auth-page">
      <div className="auth-card center-text">
        <h1 style={{ fontSize: '4rem' }}>404</h1>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>{t('notFound.message')}</p>
        <Link to="/dashboard">
          <button><Home size={16} /> {t('notFound.home')}</button>
        </Link>
      </div>
    </div>
  );
}
