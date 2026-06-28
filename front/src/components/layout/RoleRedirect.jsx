import { Navigate } from 'react-router-dom';
import { useTeam } from '../../context/TeamContext.jsx';

/**
 * Redirection racine selon le rôle :
 *   - manager d'au moins une équipe active → /dashboard
 *   - utilisateur sans équipe active        → /dashboard (état vide
 *     avec boutons « Créer » / « Rejoindre »)
 *   - équipier déjà rattaché (rôle 'equipier') → /planning
 */
export function RoleRedirect() {
  const { teams, loading } = useTeam();
  if (loading) {
    return <div className="card"><p>Chargement…</p></div>;
  }
  const activeTeams = teams.filter((f) => f.status === 'active');
  const isManager = activeTeams.some((f) => f.role === 'manager');
  const isEquipierOnly = activeTeams.length > 0 && !isManager;
  return <Navigate to={isEquipierOnly ? '/planning' : '/dashboard'} replace />;
}
