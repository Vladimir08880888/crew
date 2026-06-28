-- Migration 008 : coefficient personnalisé par équipier
--
-- Jusqu'ici, tout junior contribuait pour la même valeur (junior_coef
-- défini au niveau de l'équipe). Or tous les juniors ne se valent pas :
-- un commis en fin de période d'essai n'a pas la même productivité
-- qu'un apprenti de première année.
--
-- Cette colonne `coef_override` permet au manager de surcharger la
-- valeur par défaut du niveau pour un équipier précis. NULL = utiliser
-- le coefficient défini par le niveau (junior_coef / confirme_coef /
-- chef_coef de la table teams).

ALTER TABLE team_members
  ADD COLUMN coef_override INT DEFAULT NULL
       COMMENT 'Coefficient personnel (override le coef du niveau si non NULL)';
