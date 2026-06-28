CREATE TABLE IF NOT EXISTS team_members (
  team_id   INT NOT NULL,
  user_id     INT NOT NULL,
  role        ENUM('manager','equipier') NOT NULL DEFAULT 'equipier',
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  status      ENUM('active','pending') NOT NULL DEFAULT 'pending',
  joined_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_team_members_user (user_id),
  INDEX idx_team_members_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
