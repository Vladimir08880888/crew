-- Migration 012 : optimisation économique (cost-aware solver)
--
-- Le solver visait jusqu'ici uniquement la couverture idéale. Cette
-- migration introduit la dimension coût : chaque équipier a un taux
-- horaire (€/h), et le solver intègre un terme de pénalité sur la
-- masse salariale dans son score d'affectation.
--
-- Sur le modèle de la Convention HCR 2026 (grille des minima) :
--   Niveau I (apprenti/commis débutant) : SMIC HCR ≈ 11,88 €/h
--   Niveau II (cuisinier/serveur confirmé) : ≈ 12-14 €/h
--   Niveau III (chef de partie / chef de rang) : ≈ 13-14 €/h
--   Niveau IV (sous-chef / maître d') : ≈ 15-17 €/h
--   Niveau V (chef de cuisine / directeur salle) : ≈ 17-22 €/h
--
-- Crew stocke les taux en CENTIMES d'euro par heure (entiers) pour
-- éviter les imprécisions flottantes côté SQL.

ALTER TABLE teams
  ADD COLUMN junior_rate    INT NOT NULL DEFAULT 1200
       COMMENT 'Taux horaire Junior (apprenti/débutant) en centimes/€ (HCR niveau I-II)',
  ADD COLUMN confirme_rate  INT NOT NULL DEFAULT 1400
       COMMENT 'Taux horaire Confirmé (autonome/pilier) en centimes/€ (HCR niveau II-III)',
  ADD COLUMN chef_rate      INT NOT NULL DEFAULT 1900
       COMMENT 'Taux horaire Chef (référent) en centimes/€ (HCR niveau IV-V)';

ALTER TABLE team_members
  ADD COLUMN rate_override  INT DEFAULT NULL
       COMMENT 'Taux horaire personnel en centimes/€ (override du taux du niveau)';
