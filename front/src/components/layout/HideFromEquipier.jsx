import { Navigate } from 'react-router-dom';
import { useTeam } from '../../context/TeamContext.jsx';

/**
 * Cache la route à l'équipier déjà rattaché à une équipe (rôle 'equipier'
 * uniquement). Laisse passer :
 *   - les managers (d'au moins une équipe active)
 *   - les utilisateurs sans équipe active (nouvellement inscrits) —
 *     ils ont besoin d'accéder à /dashboard (état vide) et à
 *     /teams/join pour saisir leur code d'invitation.
 */
export function HideFromEquipier({ children }) {
  const { teams, loading } = useTeam();
  if (loading) {
    return <div className="card"><p>Chargement…</p></div>;
  }
  const activeTeams = teams.filter((f) => f.status === 'active');
  const isManager = activeTeams.some((f) => f.role === 'manager');
  const isEquipierOnly = activeTeams.length > 0 && !isManager;
  if (isEquipierOnly) {
    return <Navigate to="/planning" replace />;
  }
  return children;
}
