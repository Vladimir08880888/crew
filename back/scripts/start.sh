#!/usr/bin/env bash
# Démarrage du conteneur : MariaDB → migrations → seed (optionnel) → API Node.
#
# Variables d'env attendues :
#   DB_PASSWORD       — mot de passe utilisateur applicatif (obligatoire)
#   DB_ROOT_PASSWORD  — mot de passe root MariaDB (par défaut = DB_PASSWORD)
#   DB_NAME           — nom de la base (par défaut crew_db)
#   DB_USER           — utilisateur applicatif (par défaut reminder)
#   SEED_ON_BOOT      — si « 1 », (re)remplit la base avec les données démo
#
# Volume monté : /var/lib/mysql (sur Fly.io, attaché via fly.toml).

set -euo pipefail

: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_ROOT_PASSWORD:=$DB_PASSWORD}"
: "${DB_NAME:=crew_db}"
: "${DB_USER:=crew}"
: "${SEED_ON_BOOT:=0}"
: "${DB_HOST:=127.0.0.1}"
: "${DB_PORT:=3306}"

DATA_DIR=/var/lib/mysql

echo "[start] DB_USER=$DB_USER  DB_NAME=$DB_NAME  data dir=$DATA_DIR"

# 0. Créer le répertoire pour le socket Unix MariaDB (n'existe pas sur
# l'image Debian slim après reboot Fly).
mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld

# 1. Initialiser le data dir si vide (premier démarrage avec nouveau volume).
if [ ! -d "$DATA_DIR/mysql" ]; then
  echo "[start] initial data directory empty → mariadb-install-db"
  chown -R mysql:mysql "$DATA_DIR"
  mariadb-install-db --user=mysql --datadir="$DATA_DIR" >/dev/null
fi
chown -R mysql:mysql "$DATA_DIR"

# 2. Démarrer mariadbd en arrière-plan.
echo "[start] starting mariadbd…"
mariadbd --user=mysql --datadir="$DATA_DIR" \
         --bind-address=127.0.0.1 \
         --console &
MARIADB_PID=$!

# 3. Attendre que mariadb réponde.
echo -n "[start] waiting for mariadbd to be ready"
for i in $(seq 1 60); do
  if mariadb-admin ping --silent 2>/dev/null; then
    echo " ✓"
    break
  fi
  echo -n "."
  sleep 1
done

if ! mariadb-admin ping --silent 2>/dev/null; then
  echo "[start] ✗ mariadbd failed to start"
  exit 1
fi

# 4. Créer base + user si nécessaire (idempotent).
echo "[start] ensuring database '$DB_NAME' and user '$DB_USER' exist…"
mariadb -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

# 5. Exécuter les migrations.
echo "[start] running migrations…"
node src/db/migrate.js

# 6. Seed optionnel (set SEED_ON_BOOT=1 pour activer).
if [ "$SEED_ON_BOOT" = "1" ]; then
  echo "[start] SEED_ON_BOOT=1 → running seed (this WIPES existing data)…"
  node src/db/seed.js || echo "[start] seed failed (continuing anyway)"
fi

# 7. Lancer l'API Node (au premier plan → c'est le PID 1 du conteneur).
echo "[start] starting Node API on port ${PORT:-3000}…"
exec node src/index.js
