-- Migration 007 : paramètres de pondération de la couverture
--
-- Le smart planner ne s'appuie plus sur des constantes hardcodées : chaque
-- équipe (= établissement) déclare elle-même la « configuration idéale »
-- qui correspond à 100 % de couverture pour son volume habituel.
--
-- Concrètement, le manager configure :
--   - le coefficient de chaque niveau d'équipier (Junior / Confirmé / Chef),
--   - la capacité de référence (couverts servis quand le restaurant tourne à plein),
--   - l'idéal de coefficient par service (midi / soir) et par poste (cuisine / salle).
--
-- À ce 100 %, le manager peut ensuite déclarer un jour « à 50 % » (service tranquille)
-- et le solver scale la cible en conséquence. Le solver garantit aussi qu'un
-- junior n'est jamais seul sur un poste (≥1 confirmé/chef requis sur place).

ALTER TABLE teams
  ADD COLUMN junior_coef    INT NOT NULL DEFAULT 50
       COMMENT 'Contribution d un junior (équipier débutant) à la couverture',
  ADD COLUMN confirme_coef  INT NOT NULL DEFAULT 100
       COMMENT 'Contribution d un confirmé (référence : 100 = pleine puissance)',
  ADD COLUMN chef_coef      INT NOT NULL DEFAULT 150
       COMMENT 'Contribution d un chef de service (lead, polyvalent)',
  ADD COLUMN max_couverts   INT NOT NULL DEFAULT 100
       COMMENT 'Capacité de service à 100 % (couverts servis sur un service plein)',
  ADD COLUMN midi_cuisine_ideal  INT NOT NULL DEFAULT 200
       COMMENT 'Somme idéale de coef en cuisine pour le service midi à 100 %',
  ADD COLUMN midi_salle_ideal    INT NOT NULL DEFAULT 300
       COMMENT 'Somme idéale de coef en salle pour le service midi à 100 %',
  ADD COLUMN soir_cuisine_ideal  INT NOT NULL DEFAULT 300
       COMMENT 'Somme idéale de coef en cuisine pour le service soir à 100 %',
  ADD COLUMN soir_salle_ideal    INT NOT NULL DEFAULT 400
       COMMENT 'Somme idéale de coef en salle pour le service soir à 100 %';
