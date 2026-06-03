# Dockerfile pour le back-end Crew
# ─────────────────────────────────────────────────────────────────────
# Stratégie : un seul conteneur regroupant Node.js + MariaDB.
# Justification : Fly.io « hobby plan » free tier limite à 1 machine
# par app, donc on co-localise la BDD. En prod sérieuse on séparerait.
#
# Le volume Fly est monté sur /var/lib/mysql pour persistance des données.
# ─────────────────────────────────────────────────────────────────────

FROM node:22-bookworm-slim

# Installer MariaDB server (Debian bookworm = MariaDB 10.11)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      mariadb-server \
      mariadb-client \
      curl \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Désactiver le bind sur 127.0.0.1 uniquement (par défaut Debian) →
# autoriser localhost et le réseau interne du conteneur.
RUN sed -i 's/^bind-address.*/bind-address = 127.0.0.1/' \
      /etc/mysql/mariadb.conf.d/50-server.cnf

WORKDIR /app

# Installer les dépendances Node en couche dédiée pour cache.
COPY package*.json ./
RUN npm ci --omit=dev

# Copier le reste de l'application.
COPY . .

# Le script de démarrage : MariaDB → migrations → seed (si demandé) → API.
COPY scripts/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Volume persistant pour les données MariaDB.
VOLUME ["/var/lib/mysql"]

EXPOSE 3000

CMD ["/usr/local/bin/start.sh"]
