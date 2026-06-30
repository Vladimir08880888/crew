import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Sun, Moon, LogOut, BarChart3, Globe, CalendarDays, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTeam } from '../../context/TeamContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import './Navbar.css';

export function Navbar() {
  const { user, logout } = useAuth();
  const { teams, activeTeamId, setActiveTeamId } = useTeam();
  const { theme, toggle } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const activeTeams = teams.filter((f) => f.status === 'active');
  const isManagerSomewhere = activeTeams.some((f) => f.role === 'manager');
  // Somme des demandes en attente sur les équipes que je manage.
  // Sert au badge « Équipes (N) » qui pousse le manager à approuver.
  const totalPending = activeTeams
    .filter((f) => f.role === 'manager')
    .reduce((sum, f) => sum + (Number(f.pending_count) || 0), 0);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-logo" aria-hidden="true">
            <i></i><i></i><i></i><i></i>
          </span>
          <span>Crew</span>
        </Link>

        <nav className="navbar-links">
          {/* Sections manager : tableau de bord, planning, stats, équipes, aide */}
          {isManagerSomewhere && (
            <NavLink to="/dashboard">
              <Home size={16} /> <span>{t('nav.dashboard')}</span>
            </NavLink>
          )}
          <NavLink to="/planning">
            <CalendarDays size={16} /> <span>{t('nav.planning')}</span>
          </NavLink>
          {isManagerSomewhere && (
            <>
              <NavLink to="/stats">
                <BarChart3 size={16} /> <span>{t('nav.stats')}</span>
              </NavLink>
              <NavLink to="/teams">
                <Users size={16} />
                <span>{t('nav.teams')}</span>
                {totalPending > 0 && (
                  <span className="navbar-badge"
                        title={t('nav.pendingTitle', { count: totalPending })}>
                    {totalPending}
                  </span>
                )}
              </NavLink>
              <NavLink to="/help">
                <HelpCircle size={16} /> <span>{t('nav.help')}</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="navbar-right">
          {activeTeams.length > 0 && (
            <select
              className="team-switcher"
              value={activeTeamId || ''}
              onChange={(e) => setActiveTeamId(Number(e.target.value) || null)}
              aria-label={t('nav.activeTeam', 'Équipe active')}
            >
              <option value="">— {t('nav.noTeam', 'Sans équipe')} —</option>
              {activeTeams.map((f) => (
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
