-- Migration 011 : polyvalence (multi-skill matrix) par équipier
--
-- Le champ `poste` représente le poste PRIMAIRE de l'équipier (sa
-- spécialité, ce qui figure sur sa fiche de poste). Cette migration
-- ajoute `skills_mask` qui décrit l'ensemble des postes qu'il peut
-- TENIR en cas de besoin — c'est-à-dire sa polyvalence.
--
-- Format : bitmask 5 bits, un bit par valeur de l'enum POSTES :
--   bit 0 = cuisine
--   bit 1 = salle
--   bit 2 = plonge
--   bit 3 = bar
--   bit 4 = administration
--
-- NULL = compatibilité ascendante : le solver retombe sur l'ancien
-- comportement basé uniquement sur `poste` (avec plonge → cuisine).
-- Une fois renseigné, NULL pour un membre signifie « pas encore
-- configuré » → on suppose un mask = 1 << index_of(poste).
--
-- Le solver continue à scorer la correspondance primaire en bonus :
-- un membre polyvalent comblera un slot non-primaire seulement si
-- aucun membre primaire n'est éligible (heures, repos, etc.).

ALTER TABLE team_members
  ADD COLUMN skills_mask INT DEFAULT NULL
       COMMENT 'Bitmask postes maitrisés (bit i = poste i de POSTES). NULL = défaut basé sur poste.';
