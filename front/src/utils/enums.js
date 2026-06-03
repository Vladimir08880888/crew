export const CATEGORIES = [
  'Santé', 'Finances', 'Administratif', 'Véhicule', 'Logement', 'Corvée', 'Autre',
];

export const PRIORITIES = [
  { value: 'low',    label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high',   label: 'Haute' },
];

export const FREQUENCIES = [
  { value: 'once',    label: 'Une seule fois' },
  { value: 'daily',   label: 'Quotidienne' },
  { value: 'weekly',  label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'yearly',  label: 'Annuelle' },
];

export const ROLE_LABEL = {
  parent: 'Parent',
  child:  'Enfant',
};

export const FAMILY_ROLES = ['parent', 'child'];

// Extensions « restauration »
export const POSTES = ['cuisine', 'salle', 'bar', 'plonge', 'administration'];
export const SHIFTS = ['matin', 'midi', 'coupure', 'soir', 'nuit'];

/**
 * Résout le « rôle métier affiché » à partir d'une combinaison
 * (role, is_admin, poste). Doit correspondre à resolveJobRole côté back.
 */
export function jobRoleOf(member) {
  if (!member) return null;
  if (member.role === 'parent' && member.is_admin) return 'patron';
  if (member.role === 'parent' && member.poste === 'cuisine') return 'chef';
  if (member.role === 'parent') return 'manager';
  if (member.role === 'child'  && !member.poste)   return 'apprenti';
  return 'equipier';
}
