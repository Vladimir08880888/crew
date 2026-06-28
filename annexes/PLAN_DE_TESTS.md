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

## 2. Gestion d'équipe (Ã©quipes)

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
| 2.9 | Non-membre tente d'accéder à l'équipe  | 403 — middleware `requireTeamMember`                          | ☑      |

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

---

## 10. Solver enrichi (évolutions v2)

> Tests automatisés sur les fonctionnalités v2 (migrations 006-012).
> Scripts de référence dans `back/scripts/` ; tous exécutés contre
> `https://crew-back.fly.dev` en juin 2026.

### 10.1 Profils normalisés et fractions [0;1]

| #     | Scénario                                                       | Attendu                                                       | Statut |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 10.1.1| Migrer un settings legacy (50/100/150)                         | Valeurs renormalisées (15/40/60) après migration 009          | ☑      |
| 10.1.2| Chaque poste vise 1,00 = 100 %                                 | API summary : ideal == 100 par défaut                         | ☑      |
| 10.1.3| Profil Apprenti → coef_override = 15                           | Membre badgé 🌱 Apprenti dans MemberList                      | ☑      |
| 10.1.4| Overall service = moyenne (cuisine + salle) / 2                | `overallService[].avg_pct` cohérent vs sum/n des postes       | ☑      |

### 10.2 HCR — contraintes dures dans le solver

| #     | Scénario                                                       | Attendu                                                       | Statut |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 10.2.1| Solver ne dépasse jamais 48 h/semaine par équipier             | `max_hours <= 48` sur toute proposition                       | ☑      |
| 10.2.2| Cap quotidien 11 h cuisinier / 11h30 salle                     | Aucune journée > cap par poste primaire                       | ☑      |
| 10.2.3| Minimum 2 jours de repos hebdomadaire                          | `7 - distinct_days_worked >= 2` pour chaque membre actif      | ☑      |
| 10.2.4| Slots non couvrables → uncovered avec motif HCR                | `reason` contient « Convention HCR »                          | ☑      |
| 10.2.5| Modification manuelle qui dépasse 48 h → bandeau d'alerte      | `hcrViolations[]` non vide + citation L3121-20                | ☑      |

### 10.3 Densité prévisionnelle par (jour, service)

| #     | Scénario                                                       | Attendu                                                       | Statut |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 10.3.1| Cellule midi vendredi = 1,3 → ideal multiplié par 1,3          | `coverage[].ideal == base × 1,3` ce jour-là                   | ☑      |
| 10.3.2| Cellule à 0 → service désactivé                                | Aucun slot créé pour ce (date, service)                       | ☑      |
| 10.3.3| Priorité : per-cell > per-service > per-date > 100             | Override fin grain effectif quand multiple sources            | ☑      |
| 10.3.4| Preset « Tous → 1,0 » remplit toute la colonne                 | UI : 7 cellules d'une colonne passent à 100                   | ☑      |

### 10.4 Jours d'ouverture configurables

| #     | Scénario                                                       | Attendu                                                       | Statut |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 10.4.1| Lundi décoché → aucun slot ce jour                             | `coverage` ne contient aucune ligne pour ce dow               | ☑      |
| 10.4.2| Settings sauvegardés → solver respecte immédiatement           | Generate-plan suivant skip les jours fermés                   | ☑      |

### 10.5 Polyvalence (multi-skill)

| #     | Scénario                                                       | Attendu                                                       | Statut |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 10.5.1| `skills_mask = NULL` → comportement legacy (poste seul)        | Sophie 8 shifts tous salle, Ahmed 8 shifts tous cuisine       | ☑      |
| 10.5.2| Hard-negative : Sophie skills = cuisine seule                  | 0 shift salle assigné à Sophie (canFill rejette)              | ☑      |
| 10.5.3| Spécialiste primaire préféré au polyvalent (bonus +3)          | Sophie (spécialiste salle) > Mehdi (polyvalent) sur les shifts salle | ☑ |
| 10.5.4| Polyvalence se déclenche en sous-effectif                      | Mehdi cuisine+salle absorbe shifts salle quand Lucas absent   | ☑      |
| 10.5.5| Couverture salle ↑ avec polyvalence vs sans                    | +18 % observé sur seed démo (800 vs 680 coef cumulé)          | ☑      |

### 10.6 Cost-aware (taux horaires)

| #     | Scénario                                                       | Attendu                                                       | Statut |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 10.6.1| Settings expose junior_rate / confirme_rate / chef_rate        | API `/settings` retourne 1200 / 1400 / 1900 par défaut        | ☑      |
| 10.6.2| Override personnel prime sur niveau                            | `rate_override` utilisé par `rateOf()` si non NULL            | ☑      |
| 10.6.3| À déficit hebdomadaire égal, solver choisit le moins cher      | Sur slots interchangeables, confirmé préféré au chef          | ☑      |
| 10.6.4| Pénalité coût n'écrase jamais le besoin de couverture          | Aucun slot n'est dégradé pour économiser                      | ☑      |
| 10.6.5| Masse salariale calculée et exposée                            | `laborCostTotal` cohérent vs sum(planned × rate) des membres  | ☑      |
| 10.6.6| Affichage UI Planning : `💶 Masse salariale : XXX €`           | Visible manager uniquement                                    | ☑      |

### 10.7 Alertes science-based

| #     | Scénario                                                       | Attendu                                                       | Statut |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 10.7.1| midi + soir > 120 % le même jour → fatigueAlerts               | Bandeau rouge avec citation KC & Terwiesch 2009               | ☑      |
| 10.7.2| ≥3 services chargés ≥ 130 % sur 7 jours                        | Alerte « weekly_overload » avec citation Wen et al. 2020      | ☑      |
| 10.7.3| Service Health Score 🟢 / 🟠 / 🔴 dans l'en-tête de colonne     | Pastilles affichées par (jour, service)                       | ☑      |

### Bilan v2

| Bloc           | PASS  | Total | Notes                                                  |
| -------------- | ----- | ----- | ------------------------------------------------------ |
| 10.1 Profils   | 4/4   | 4     | Migration 009 idempotente                              |
| 10.2 HCR       | 5/5   | 5     | Code du travail L3121-20 + Convention HCR              |
| 10.3 Densité   | 4/4   | 4     | Priorité hiérarchique respectée                        |
| 10.4 Open days | 2/2   | 2     | Bitmask 7 bits                                         |
| 10.5 Multi-skill| 5/5  | 5     | Jordan & Graves 1995 chaîne courte                     |
| 10.6 Cost      | 6/6   | 6     | HCR 2026 minima sectoriels                             |
| 10.7 Alertes   | 3/3   | 3     | Citations peer-reviewed inline                         |
| **Total**      | **29/29** | **29** | Tous les scripts archivés dans `back/scripts/`     |
