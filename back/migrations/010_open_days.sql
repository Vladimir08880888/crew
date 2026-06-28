-- Migration 010 : jours d'ouverture configurables
--
-- Jusqu'ici la fermeture du lundi était codée en dur dans
-- DEFAULT_CLOSED_DAYS (constants.js). On délègue cette information au
-- manager via une colonne sur teams.
--
-- Format : bitmask 7 bits, bit i = 1 si le jour i est FERMÉ.
-- Indexation : 0 = dimanche, 1 = lundi, 2 = mardi, ... 6 = samedi
-- (cohérent avec Date.prototype.getDay() en JS).
--
-- Default = 2 (binaire 0000010) : seul le lundi est fermé.
-- Toutes les valeurs existantes héritent du default.

ALTER TABLE teams
  ADD COLUMN closed_days_mask INT NOT NULL DEFAULT 2
       COMMENT 'Bitmask jours fermés (bit i = 1 si fermé, i=0..6 dim..sam). Default 2 = lundi.';
