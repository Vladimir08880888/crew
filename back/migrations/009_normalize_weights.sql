-- Migration 009 : normalisation des coefficients sur l'échelle [0, 1].
--
-- Modèle simplifié pour le manager :
--   - chaque poste a un objectif normalisé de 1,00 (= 100 % de l'équipe
--     idéale pour ce poste sur ce service) ;
--   - chaque équipier apporte un poids strictement inférieur à 1 ;
--   - la couverture par service est la MOYENNE des couvertures de chaque
--     poste (cuisine + salle) / 2.
--
-- Valeurs de référence (stockées en centièmes pour rester INT) :
--   Apprenti  : 0,15   (ancien junior 50 ou apprenti-50)
--   Débutant  : 0,25   (ancien junior+ 75)
--   Autonome  : 0,40   (ancien confirmé 100)
--   Pilier    : 0,50   (ancien confirmé+ 125)
--   Référent  : 0,60   (ancien chef 150)
--
-- Anciens defaults d'équipe :
--   junior_coef=50 → 15 ; confirme_coef=100 → 40 ; chef_coef=150 → 60
--   midi_cuisine_ideal=200 → 100 ; midi_salle_ideal=300 → 100 ;
--   soir_cuisine_ideal=300 → 100 ; soir_salle_ideal=400 → 100.

UPDATE families SET
  junior_coef        = 15  WHERE junior_coef        = 50;
UPDATE families SET
  confirme_coef      = 40  WHERE confirme_coef      = 100;
UPDATE families SET
  chef_coef          = 60  WHERE chef_coef          = 150;
UPDATE families SET
  midi_cuisine_ideal = 100 WHERE midi_cuisine_ideal = 200;
UPDATE families SET
  midi_salle_ideal   = 100 WHERE midi_salle_ideal   = 300;
UPDATE families SET
  soir_cuisine_ideal = 100 WHERE soir_cuisine_ideal = 300;
UPDATE families SET
  soir_salle_ideal   = 100 WHERE soir_salle_ideal   = 400;

ALTER TABLE families
  MODIFY COLUMN junior_coef         INT NOT NULL DEFAULT 15,
  MODIFY COLUMN confirme_coef       INT NOT NULL DEFAULT 40,
  MODIFY COLUMN chef_coef           INT NOT NULL DEFAULT 60,
  MODIFY COLUMN midi_cuisine_ideal  INT NOT NULL DEFAULT 100,
  MODIFY COLUMN midi_salle_ideal    INT NOT NULL DEFAULT 100,
  MODIFY COLUMN soir_cuisine_ideal  INT NOT NULL DEFAULT 100,
  MODIFY COLUMN soir_salle_ideal    INT NOT NULL DEFAULT 100;

-- Rescaling des coef_override individuels positionnés via l'ancien profil.
UPDATE family_members SET coef_override = 15  WHERE coef_override = 50;
UPDATE family_members SET coef_override = 25  WHERE coef_override = 75;
UPDATE family_members SET coef_override = 40  WHERE coef_override = 100;
UPDATE family_members SET coef_override = 50  WHERE coef_override = 125;
UPDATE family_members SET coef_override = 60  WHERE coef_override = 150;
