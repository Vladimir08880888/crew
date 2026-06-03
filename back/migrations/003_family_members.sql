CREATE TABLE IF NOT EXISTS family_members (
  family_id   INT NOT NULL,
  user_id     INT NOT NULL,
  role        ENUM('parent','child') NOT NULL DEFAULT 'child',
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  status      ENUM('active','pending') NOT NULL DEFAULT 'pending',
  joined_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (family_id, user_id),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_family_members_user (user_id),
  INDEX idx_family_members_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
