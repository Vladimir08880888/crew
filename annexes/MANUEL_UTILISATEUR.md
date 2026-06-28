# Manuel utilisateur — Crew

> Guide rapide pour les **managers** et **équipiers**.
> Application accessible sur https://crew-planner-hazel.vercel.app
> Aucune installation requise — fonctionne dans un navigateur récent (Chrome, Safari, Firefox, Edge).

---

## Partie 1 — Manager (responsable d'équipe)

### 1.1 Créer son compte

1. Ouvrir l'application.
2. Cliquer sur **« S'inscrire »**.
3. Renseigner email, prénom, nom, mot de passe (≥ 8 caractères).
4. Valider — l'utilisateur arrive sur son tableau de bord vide.

### 1.2 Créer une équipe

1. Depuis le dashboard, cliquer sur **« Créer une équipe »**.
2. Donner un nom (ex. *Bistrot du Vieux Port*).
3. Crew génère automatiquement un **code d'invitation à 6 caractères**.
4. Partager ce code aux équipiers (SMS, oral, affiche en salle de pause).

### 1.3 Configurer chaque équipier

Quand un équipier rejoint l'équipe, il apparaît en attente d'approbation.

1. Aller dans **« Mon équipe »**.
2. Cliquer sur le membre en attente → **« Approuver »**.
3. Définir pour ce membre :
   - **Poste** : cuisine / salle / bar / plonge / administration.
   - **Shift habituel** : matin / midi / coupure / soir / nuit.
   - **Heures hebdomadaires cibles** : 35h, 24h, ou autre valeur contractuelle.

> Astuce : laisser **0 heures** pour exclure un membre du planning automatique (utile pour les cadres, les extras occasionnels).

### 1.4 Générer un planning automatique

1. Aller dans **« Planning »**.
2. Sélectionner la semaine désirée.
3. Cliquer sur **« Smart planner »**.
4. Crew propose une grille respectant :
   - les heures contractuelles de chacun,
   - max 6 jours consécutifs travaillés,
   - les préférences de shift (`shift_default`).
5. Une alerte signale les **sous-couvertures** éventuelles.
6. Modifier manuellement si besoin (glisser-déposer, ou clic + édition).
7. Cliquer sur **« Valider et publier »**.

### 1.5 Réutiliser une semaine type

- **Cloner la semaine précédente** : un clic dans la barre d'action duplique tous les shifts avec un décalage de +7 jours.
- **Vider la semaine** : suppression complète après confirmation.

### 1.6 Consulter les statistiques

L'onglet **« Statistiques »** affiche :

- heures planifiées vs cibles contractuelles par équipier,
- couverture par poste (cuisine / salle / bar…),
- graphiques hebdomadaires (Chart.js).

---

## Partie 2 — Équipier

### 2.1 Créer son compte et rejoindre l'équipe

1. Ouvrir l'application, cliquer sur **« S'inscrire »**.
2. Créer son compte (email + mot de passe).
3. Cliquer sur **« Rejoindre une équipe »**.
4. Saisir le **code à 6 caractères** transmis par le manager.
5. Attendre l'approbation (notification visible au prochain rafraîchissement).

### 2.2 Consulter son planning

- **Dashboard** : aperçu des shifts à venir.
- **Planning** : vue lecture seule de la grille hebdomadaire, ses propres shifts mis en évidence.

### 2.3 Synchroniser avec son calendrier téléphone

C'est la fonctionnalité-clé de Crew : **zéro application à installer**.

1. Aller dans **« Profil »**.
2. Copier l'URL personnelle qui ressemble à
   `https://crew-back.fly.dev/api/calendar/<votre-token>/perso.ics`.
3. Sur **iPhone** : Réglages → Calendrier → Comptes → Ajouter un compte → Autre → Ajouter un compte d'abonnement → coller l'URL.
4. Sur **Android (Google Calendar)** : `calendar.google.com` → côté gauche → **« Ajouter un agenda »** → **« À partir d'une URL »** → coller l'URL.
5. Les services apparaissent automatiquement, avec un **rappel 2 heures avant** chaque shift.

> Important : si l'URL fuite, demander au manager de **régénérer le token** depuis le profil — l'ancien lien devient invalide.

### 2.4 Changer son mot de passe

1. **« Profil »** → **« Changer le mot de passe »**.
2. Saisir l'ancien et le nouveau mot de passe.
3. Reconnexion automatique.

### 2.5 Quitter une équipe

**« Mon équipe »** → **« Quitter »** → confirmation.
L'admin reçoit une notification.

---

## Partie 3 — Questions fréquentes

| Question                                              | Réponse                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| Mon code d'invitation ne fonctionne plus              | Le manager l'a peut-être régénéré. Demander le nouveau.              |
| Le calendrier ne se met pas à jour                    | Sync Google ≈ 12 h. Apple < 1 h. Forcer en supprimant/rajoutant.     |
| Je suis exclu du smart planner                        | Mes heures cibles sont à 0 ou NULL. Demander au manager de les fixer. |
| Comment basculer en mode sombre / langue anglaise ?   | Icônes en haut à droite de toutes les pages.                          |
| J'ai oublié mon mot de passe                          | Demander à un autre admin de réinitialiser, ou support technique.    |

## Partie 4 — Support

- **Email** : rodzaevski@icloud.com
- **Code source** : projet de soutenance DWWM — Vladimir Rodzaevskiy
- **Statut** : démo en production https://crew-planner-hazel.vercel.app
