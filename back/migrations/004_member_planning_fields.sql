-- Migration 004 : champs métier pour le planning intelligent
--
-- Étend la table family_members avec trois informations utilisées par
-- le solver d'auto-planning :
--
--   POSTE                — zone fonctionnelle (cuisine, salle, bar, plonge,
--                          administration). Permet d'affecter les bons
--                          profils aux bons services.
--
--   SHIFT_DEFAULT        — créneau habituel (matin/midi/coupure/soir/nuit).
--                          Préférence personnelle qui sert d'indice de
--                          score lors de la génération automatique.
--
--   WEEKLY_HOURS_TARGET  — heures cibles par semaine (35h, 24h, etc.).
--                          Le solver répartit les shifts pour s'approcher
--                          de cette cible sans la dépasser. NULL ou 0 =
--                          exclu du solver (cas typique des cadres).

ALTER TABLE family_members
  ADD COLUMN poste ENUM('cuisine','salle','bar','plonge','administration')
       DEFAULT NULL
       COMMENT 'Poste fonctionnel (ex: cuisine, salle, bar)',
  ADD COLUMN shift_default ENUM('matin','midi','coupure','soir','nuit')
       DEFAULT NULL
       COMMENT 'Shift habituel — préférence personnelle',
  ADD COLUMN weekly_hours_target INT DEFAULT NULL
       COMMENT 'Heures cibles par semaine (0 ou NULL = exclu de l auto-planning)',
  ADD INDEX idx_family_members_poste (family_id, poste);
