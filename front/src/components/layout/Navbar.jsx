import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Sun, Moon, LogOut, BarChart3, Globe, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFamily } from '../../context/FamilyContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import './Navbar.css';

export function Navbar() {
  const { user, logout } = useAuth();
  const { families, activeFamilyId, setActiveFamilyId } = useFamily();
  const { theme, toggle } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const activeFamilies = families.filter((f) => f.status === 'active');

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-mark">👥</span>
          <span>Crew</span>
        </Link>

        <nav className="navbar-links">
          <NavLink to="/dashboard">
            <Home size={16} /> <span>{t('nav.dashboard')}</span>
          </NavLink>
          <NavLink to="/planning">
            <CalendarDays size={16} /> <span>{t('nav.planning')}</span>
          </NavLink>
          <NavLink to="/stats">
            <BarChart3 size={16} /> <span>{t('nav.stats')}</span>
          </NavLink>
          <NavLink to="/teams">
            <Users size={16} /> <span>{t('nav.teams')}</span>
          </NavLink>
        </nav>

        <div className="navbar-right">
          {activeFamilies.length > 0 && (
            <select
              className="family-switcher"
              value={activeFamilyId || ''}
              onChange={(e) => setActiveFamilyId(Number(e.target.value) || null)}
              aria-label={t('nav.activeTeam', 'Équipe active')}
            >
              <option value="">— {t('nav.noTeam', 'Sans équipe')} —</option>
              {activeFamilies.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}

          <button
            className="ghost icon-only"
            onClick={toggleLanguage}
            title={i18n.language === 'en' ? 'Français' : 'English'}
            aria-label="Toggle language"
          >
            <Globe size={18} />
            <span style={{ fontSize: '0.7rem', marginLeft: 2, fontWeight: 600 }}>
              {i18n.language === 'en' ? 'EN' : 'FR'}
            </span>
          </button>

          <button
            className="ghost icon-only"
            onClick={toggle}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            aria-label="Changer de thème"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link to="/profile" className="navbar-user" title={t('nav.profile')}>
            <span className="navbar-avatar">
              {(user?.first_name?.[0] || '?').toUpperCase()}
            </span>
            <span className="navbar-username">{user?.first_name}</span>
          </Link>

          <button className="ghost icon-only" onClick={handleLogout} title={t('nav.logout')} aria-label={t('nav.logout')}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
