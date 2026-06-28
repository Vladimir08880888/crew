-- Migration 006 : niveau d'expérience pour pondérer la couverture
--
-- Chaque équipier reçoit un niveau qui pèse sur la couverture journalière :
--   junior    = 50  (apprenti, débutant, demi-puissance)
--   confirme  = 100 (équipier autonome, valeur de référence)
--   chef      = 150 (chef de service, lead, polyvalent)
--
-- Le solver d'auto-planning vise désormais une somme journalière de
-- coefficients ≥ 100 (idéal) avec un plancher de 50 (mi-puissance).
-- Cela permet par exemple « 1 confirmé suffit », « 2 juniors couvrent
-- aussi », « 1 chef + 1 junior = 200 » (sur-couverture).

ALTER TABLE team_members
  ADD COLUMN level ENUM('junior','confirme','chef')
       NOT NULL DEFAULT 'confirme'
       COMMENT 'Niveau d expérience (pondère la couverture journalière)';
