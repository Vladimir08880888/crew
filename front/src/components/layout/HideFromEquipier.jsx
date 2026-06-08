import { Navigate } from 'react-router-dom';
import { useFamily } from '../../context/FamilyContext.jsx';

/**
 * Cache la route à l'équipier déjà rattaché à une équipe (rôle 'child'
 * uniquement). Laisse passer :
 *   - les managers (parent d'au moins une équipe active)
 *   - les utilisateurs sans équipe active (nouvellement inscrits) —
 *     ils ont besoin d'accéder à /dashboard (état vide) et à
 *     /teams/join pour saisir leur code d'invitation.
 */
export function HideFromEquipier({ children }) {
  const { families, loading } = useFamily();
  if (loading) {
    return <div className="card"><p>Chargement…</p></div>;
  }
  const activeFamilies = families.filter((f) => f.status === 'active');
  const isManager = activeFamilies.some((f) => f.role === 'parent');
  const isEquipierOnly = activeFamilies.length > 0 && !isManager;
  if (isEquipierOnly) {
    return <Navigate to="/planning" replace />;
  }
  return children;
}
