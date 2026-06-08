import { Navigate } from 'react-router-dom';
import { useFamily } from '../../context/FamilyContext.jsx';

/**
 * Redirection racine selon le rôle :
 *   - manager d'au moins une équipe active → /dashboard
 *   - utilisateur sans équipe active        → /dashboard (état vide
 *     avec boutons « Créer » / « Rejoindre »)
 *   - équipier déjà rattaché (rôle 'child') → /planning
 */
export function RoleRedirect() {
  const { families, loading } = useFamily();
  if (loading) {
    return <div className="card"><p>Chargement…</p></div>;
  }
  const activeFamilies = families.filter((f) => f.status === 'active');
  const isManager = activeFamilies.some((f) => f.role === 'parent');
  const isEquipierOnly = activeFamilies.length > 0 && !isManager;
  return <Navigate to={isEquipierOnly ? '/planning' : '/dashboard'} replace />;
}
