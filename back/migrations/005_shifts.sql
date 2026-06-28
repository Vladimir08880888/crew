-- Migration 005 : table « shifts » — le cœur de Crew
--
-- Chaque ligne représente un créneau de travail planifié pour un
-- équipier donné. Le solver d'auto-planning produit ces lignes en
-- batch ; les managers peuvent aussi en créer manuellement via la
-- vue planning.
--
-- Champs :
--   user_id        — l'équipier qui travaille
--   date           — jour calendaire
--   shift_type     — matin / midi / coupure / soir / nuit
--   start_time     — heure de début optionnelle (sinon dérivée du type)
--   end_time       — heure de fin optionnelle
--   poste          — zone fonctionnelle (peut différer du poste habituel
--                    pour les renforts cross-équipe)
--   note           — commentaire libre (ex. "Renfort fin de service")
--   created_by     — manager qui a créé / modifié le shift
--
-- Contrainte d'unicité (user_id, date, shift_type) : un équipier ne
-- peut pas être planifié deux fois sur le même créneau du même jour.

CREATE TABLE IF NOT EXISTS shifts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  team_id     INT NOT NULL,
  user_id       INT NOT NULL,
  date          DATE NOT NULL,
  shift_type    ENUM('matin','midi','coupure','soir','nuit') NOT NULL,
  start_time    TIME DEFAULT NULL,
  end_time      TIME DEFAULT NULL,
  poste         ENUM('cuisine','salle','bar','plonge','administration') NOT NULL,
  note          TEXT DEFAULT NULL,
  created_by    INT DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (team_id)  REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL,

  INDEX idx_shifts_user_date    (user_id, date),
  INDEX idx_shifts_team_date  (team_id, date),
  UNIQUE KEY ux_shift_user_day_type (user_id, date, shift_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
