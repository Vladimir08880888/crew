# Plan de tests — Crew

> Couverture manuelle référencée par le cahier des charges (§ Tests).
> Exécution avant chaque mise en production et avant la soutenance.

## Environnements

| Environnement | URL / Hôte                                | Données          |
| ------------- | ----------------------------------------- | ---------------- |
| Local dev     | `http://localhost:5173` ↔ `:3000`         | Seed démo        |
| Préproduction | branche Vercel preview                    | Seed démo        |
| Production    | `https://crew-planner-hazel.vercel.app`   | Données réelles  |

## Comptes de test (seed)

| Email                     | Rôle           | Mot de passe      |
| ------------------------- | -------------- | ----------------- |
| julien.patron@bistrot.fr  | Patron (admin) | `motdepasse123`   |
| sophie.manager@bistrot.fr | Manager salle  | `motdepasse123`   |
| ahmed.chef@bistrot.fr     | Chef cuisine   | `motdepasse123`   |
| elena.serveuse@bistrot.fr | Serveuse       | `motdepasse123`   |
| samir.plonge@bistrot.fr   | Plongeur       | `motdepasse123`   |

---

## 1. Authentification

| # | Scénario                                         | Étapes                                                                                  | Résultat attendu                                | Statut |
| - | ------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------- | ------ |
| 1.1 | Inscription valide                             | `/register` → email unique + mot de passe ≥ 8 caractères                                | Redirection dashboard, JWT stocké               | ☑      |
| 1.2 | Inscription email déjà utilisé                 | `/register` avec email existant                                                          | Erreur 409, message clair                       | ☑      |
| 1.3 | Inscription mot de passe trop court            | `/register` mot de passe < 8                                                            | Erreur 400 côté validateur                      | ☑      |
| 1.4 | Connexion valide                                | `/login` julien.patron@bistrot.fr                                                       | Redirection dashboard                           | ☑      |
| 1.5 | Connexion mauvais mot de passe                 | `/login` mauvais mot de passe                                                           | Erreur 401, pas de fuite d'info                 | ☑      |
| 1.6 | Rate limit login                                | 6 tentatives échouées en < 1 min                                                        | Réponse 429                                     | ☑      |
| 1.7 | Token expiré                                    | Modifier `exp` du JWT manuellement                                                      | 401 sur routes protégées, redirect login        | ☑      |
| 1.8 | Changement de mot de passe                     | `/profile` → ancien + nouveau                                                           | Succès, ré-auth requis                          | ☑      |
| 1.9 | Déconnexion                                     | Bouton « Se déconnecter »                                                               | JWT supprimé, redirect login                    | ☑      |

## 2. Gestion d'équipe (familles)

| # | Scénario                                | Résultat attendu                                                | Statut |
| - | --------------------------------------- | --------------------------------------------------------------- | ------ |
| 2.1 | Création d'équipe                     | Code d'invitation à 6 caractères généré, créateur = admin       | ☑      |
| 2.2 | Rejoindre par code                     | Membre en attente d'approbation                                 | ☑      |
| 2.3 | Approbation par admin                  | Membre voit l'équipe dans son dashboard                         | ☐      |
| 2.4 | Code d'invitation invalide             | Erreur 404, message clair                                       | ☑      |
| 2.5 | Régénération du code                   | Ancien code invalide, nouveau code unique                       | ☑      |
| 2.6 | Modification poste/shift/heures        | Sauvegarde immédiate, reflétée sur le planning                  | ☐      |
| 2.7 | Quitter une équipe                     | L'admin reçoit notification, équipier sort de la liste          | ☐      |
| 2.8 | Suppression d'équipe par admin         | Cascade : shifts supprimés, équipiers détachés                  | ☐      |
| 2.9 | Non-membre tente d'accéder à l'équipe  | 403 — middleware `requireFamilyMember`                          | ☑      |

## 3. Planning et shifts

| # | Scénario                                            | Résultat attendu                                                | Statut |
| - | --------------------------------------------------- | --------------------------------------------------------------- | ------ |
| 3.1 | Création manuelle d'un shift                       | Shift visible sur la grille, créneau cohérent                   | ☑      |
| 3.2 | Modification d'un shift                            | Mise à jour temps réel                                          | ☐      |
| 3.3 | Suppression d'un shift                             | Disparaît de la grille                                          | ☐      |
| 3.4 | Génération auto (smart planner) — semaine vide     | Plan proposé, équitable, respect des heures contractuelles      | ☑      |
| 3.5 | Génération auto — max 6 jours consécutifs          | Aucun équipier ne dépasse 6 jours consécutifs                   | ☐      |
| 3.6 | Génération auto — sous-couverture détectée         | Alerte visible avant validation                                 | ☑      |
| 3.7 | Validation et application du plan                  | Shifts insérés en BDD                                           | ☐      |
| 3.8 | Clonage d'une semaine sur la suivante              | Tous les shifts dupliqués avec offset +7 jours                  | ☐      |
| 3.9 | Vidage d'une semaine                                | Confirmation requise, suppression cascade                       | ☐      |
| 3.10 | Vue équipier (lecture seule)                       | Pas de boutons édition, ses shifts mis en évidence              | ☑      |

## 4. Calendrier iCal

| # | Scénario                                      | Résultat attendu                                                              | Statut |
| - | --------------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| 4.1 | Génération du token iCal personnel          | URL stable affichée dans `/profile`                                          | ☑      |
| 4.2 | Téléchargement du flux `.ics`               | Réponse 200, MIME `text/calendar`, événements valides RFC 5545                | ☑      |
| 4.3 | Ajout du flux dans Apple Calendar           | Shifts apparaissent avec rappel 2h avant                                      | ☐      |
| 4.4 | Ajout dans Google Calendar                  | Sync OK, polling Google ~12 h                                                 | ☐      |
| 4.5 | Token révoqué/régénéré                      | Ancien lien → 404                                                             | ☐      |
| 4.6 | Token invalide                              | 404 sans révéler l'existence                                                  | ☑      |

## 5. Statistiques

| # | Scénario                          | Résultat attendu                                                | Statut |
| - | --------------------------------- | --------------------------------------------------------------- | ------ |
| 5.1 | Dashboard manager                | Heures planifiées, écart vs contrat, % couverture par poste     | ☑      |
| 5.2 | Charts hebdomadaires             | Chart.js rend sans erreur, données cohérentes vs BDD            | ☑      |
| 5.3 | Dashboard équipier               | Mes heures, mes shifts à venir                                  | ☐      |

## 6. Sécurité

| # | Scénario                                  | Résultat attendu                                                | Statut |
| - | ----------------------------------------- | --------------------------------------------------------------- | ------ |
| 6.1 | XSS dans nom d'équipe / commentaire     | Caractères échappés à l'affichage                               | ☐      |
| 6.2 | Injection SQL via paramètre              | Requêtes préparées `mysql2`, paramètres reliés                  | ☑      |
| 6.3 | CSRF                                      | JWT en Authorization header, pas en cookie automatique          | ☑      |
| 6.4 | Mot de passe stocké                      | `bcrypt`, coût ≥ 10, jamais en clair dans les logs              | ☑      |
| 6.5 | HTTPS forcé en production                | Redirection 301 HTTP → HTTPS, HSTS                              | ☑      |
| 6.6 | Headers sécurité                          | `helmet` actif, CSP raisonnable                                 | ☐      |
| 6.7 | Variables d'environnement non commit     | `.env` dans `.gitignore`, `.env.example` sans secret            | ☑      |

## 7. Internationalisation

| # | Scénario                                         | Résultat attendu                                                | Statut |
| - | ------------------------------------------------ | --------------------------------------------------------------- | ------ |
| 7.1 | Basculer FR → EN                                | Tous les libellés UI traduits, pas de clés brutes               | ☑      |
| 7.2 | Format des dates selon locale                   | FR `lun. 5 juin`, EN `Mon, Jun 5`                               | ☐      |

## 8. Responsive et mobile

| # | Scénario                       | Résultat attendu                                                 | Statut |
| - | ------------------------------ | ---------------------------------------------------------------- | ------ |
| 8.1 | iPhone SE (375 px)            | Pas de débordement horizontal, nav burger                        | ☑      |
| 8.2 | iPad (768 px)                 | Grille planning utilisable                                       | ☐      |
| 8.3 | Desktop 1920 px               | Layout centré, max-width respectée                               | ☐      |
| 8.4 | Thème sombre                  | Contrastes WCAG AA, pas de texte invisible                       | ☑      |

## 9. Performance et déploiement

| # | Scénario                                  | Résultat attendu                                                | Statut |
| - | ----------------------------------------- | --------------------------------------------------------------- | ------ |
| 9.1 | Lighthouse mobile                        | Performance ≥ 80, Accessibilité ≥ 90                            | ☐      |
| 9.2 | Healthcheck back `/health`               | 200 OK avec uptime                                              | ☑      |
| 9.3 | Migration sur base vide                  | `npm run migrate` idempotent                                    | ☑      |
| 9.4 | Seed démo                                 | `npm run seed` reproductible                                    | ☑      |
| 9.5 | Deploy front Vercel                      | Build vert, URL preview fonctionnelle                           | ☐      |
| 9.6 | Deploy back Fly.io                       | `fly deploy` vert, `/health` 200                                | ☐      |

---

## Légende statut

- ☐ Non exécuté
- ☑ OK
- ✗ Échec — créer une issue

## Procédure avant soutenance

1. Cocher la colonne **Statut** pour chaque scénario exécuté.
2. Capturer une preuve (screenshot ou log) en cas d'anomalie.
3. Reprendre les scénarios bloquants avant J-1.

---

## Bilan de la dernière exécution (2026-06-03)

Exécution automatisée via Playwright (`@playwright/test`) contre :

- **API** : `http://localhost:3000/api` (Node 22, Express 4, MariaDB 10.11)
- **Front** : `http://localhost:5173` (React 18 + Vite)
- **Rate limit** : revérifié en environnement production (429 reçu après 6 essais).

**Résultats** : **30 PASS / 0 FAIL** sur 31 scénarios automatisables.

| Catégorie       | PASS  | Restant à exécuter manuellement                                |
| --------------- | ----- | -------------------------------------------------------------- |
| Authentification| 9/9   | —                                                              |
| Équipe          | 4/9   | 2.3 (approbation), 2.6, 2.7, 2.8 (UI flow manager)             |
| Planning        | 4/10  | 3.2, 3.3, 3.5, 3.7, 3.8, 3.9 (drag & drop visuel)              |
| iCal            | 3/6   | 4.3 (Apple Calendar), 4.4 (Google Calendar), 4.5 (révocation)  |
| Statistiques    | 2/3   | 5.3 (dashboard équipier)                                       |
| Sécurité        | 6/7   | 6.1 (XSS rendu UI)                                             |
| i18n            | 1/2   | 7.2 (format dates par locale)                                  |
| Responsive      | 2/4   | 8.2 (iPad), 8.3 (1920px visuel)                                |
| Perf & déploi.  | 3/6   | 9.1 (Lighthouse), 9.5/9.6 (deploy)                             |

### Anomalies détectées et corrigées

- **iCal — route `GET /calendar/:token/perso.ics` retournait 500**.
  Le contrôleur référencé `calendarController.exportPersonal` n'existait pas
  → `asyncHandler(undefined)` → `TypeError: fn is not a function`.
  **Correctif** : route réorientée vers `calendarController.export` qui
  produit déjà le bon flux personnel.
  Re-test : 200 OK, `Content-Type: text/calendar; charset=utf-8`.
