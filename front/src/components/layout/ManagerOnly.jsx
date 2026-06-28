import { Navigate } from 'react-router-dom';
import { useTeam } from '../../context/TeamContext.jsx';

/**
 * Restreint l'accès aux managers (d'au moins une équipe active).
 * Un équipier qui tente d'atteindre une URL manager est renvoyé sur
 * son planning. Évite d'avoir à dupliquer la garde dans chaque page.
 */
export function ManagerOnly({ children }) {
  const { teams, loading } = useTeam();
  if (loading) {
    return <div className="card"><p>Chargement…</p></div>;
  }
  const isManagerSomewhere = teams.some(
    (f) => f.role === 'manager' && f.status === 'active',
  );
  if (!isManagerSomewhere) {
    return <Navigate to="/planning" replace />;
  }
  return children;
}
