export const CATEGORIES = [
  'Santé',
  'Finances',
  'Administratif',
  'Véhicule',
  'Logement',
  'Corvée',
  'Autre',
];

export const PRIORITIES = ['low', 'medium', 'high'];

export const FREQUENCIES = ['once', 'daily', 'weekly', 'monthly', 'yearly'];

export const TASK_STATUSES = ['pending', 'pending_review', 'completed'];

export const FAMILY_ROLES = ['manager', 'equipier'];

export const MEMBER_STATUSES = ['active', 'pending'];

// ──────────────────────────────────────────────────────────────────────
// Extensions « restauration » — concepts métier introduits par la
// migration 007. Toujours optionnels (NULL = contexte familial).
// ──────────────────────────────────────────────────────────────────────
export const POSTES = ['cuisine', 'salle', 'bar', 'plonge', 'administration'];
export const SHIFTS = ['matin', 'midi', 'coupure', 'soir', 'nuit'];

// Niveaux d'expérience (pondération de la couverture par équipier).
// Le coefficient effectif est lu dans family.settings — ces valeurs ne
// servent qu'à valider l'enum côté API.
export const LEVELS = ['junior', 'confirme', 'chef'];

// Postes et services pris en charge par le solver (« cuisine » regroupe
// la plonge, plus de service du matin). Les autres valeurs de l'enum
// restent acceptées pour la rétro-compatibilité des shifts existants.
export const PLANNING_POSTES = ['cuisine', 'salle'];
export const PLANNING_SHIFTS = ['midi', 'soir'];

/**
 * Durée standard d'un shift en heures (utilisée par le solver
 * de planning pour calculer les heures effectives par équipier).
 */
export const SHIFT_DURATIONS = {
  matin:   4,
  midi:    4.5,
  coupure: 2.5,
  soir:    5.5,
  nuit:    4,
};

/**
 * Couverture minimum requise pour qu'un service ait lieu.
 * Modélisé par poste pour chaque shift_type qui peut ouvrir.
 *
 * { shift_type: { poste: nombreMin } }
 *
 * Exemple : midi = 1 chef cuisine + 1 salle minimum, sinon le
 * service ne peut pas avoir lieu correctement.
 */
export const SERVICE_COVERAGE = {
  midi: { cuisine: 1, salle: 1 },
  soir: { cuisine: 1, salle: 1, plonge: 1 },
  matin: { cuisine: 1 },
  coupure: {},
  nuit: {},
};

/**
 * Jours fermés par défaut (0=dim, 1=lun … 6=sam).
 * Le solver ne propose pas de shift sur ces jours sauf override.
 */
export const DEFAULT_CLOSED_DAYS = [1];   // lundi

/**
 * Résout le « rôle métier affiché » à partir de la combinaison
 * (role, is_admin, poste). Permet d'avoir 5 rôles fonctionnels riches
 * sans changer le schéma sous-jacent.
 *
 *   patron       : manager + admin
 *   manager      : manager + poste salle/bar/administration (non chef)
 *   chef         : manager + poste cuisine
 *   equipier     : equipier + poste défini (≠ apprenti)
 *   apprenti     : equipier + poste NULL
 */
export function resolveJobRole(member) {
  if (!member) return null;
  if (member.role === 'manager' && member.is_admin) return 'patron';
  if (member.role === 'manager' && member.poste === 'cuisine') return 'chef';
  if (member.role === 'manager') return 'manager';
  if (member.role === 'equipier'  && !member.poste)   return 'apprenti';
  return 'equipier';
}

export const LIMITS = {
  TITLE_MAX: 200,
  PASSWORD_MIN: 8,
  NAME_MAX: 100,
  EMAIL_MAX: 255,
};
