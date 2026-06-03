# Crew — Planning d'équipe intelligent

> Application web responsive pour la planification de services d'équipe.
> Solver d'auto-planning, suivi des heures contractuelles, sync calendrier natif.

**Démo en production** : https://crew-planner.vercel.app

---

## Pour qui ?

Crew s'adresse à tout responsable d'équipe avec rotation de shifts :
restauration, hôtellerie, retail, santé, sécurité, événementiel.

Le manager configure une fois pour chaque équipier :
- son **poste** (cuisine, salle, bar, plonge, administration — ou personnalisable),
- son **shift habituel** (matin, midi, coupure, soir, nuit),
- ses **heures hebdomadaires cibles** (35h, 24h, etc., selon contrat).

Ensuite, le smart planner propose un planning en un clic, équitable et
respectueux des contraintes (max 6 jours consécutifs, sous-couverture
signalée). Le manager valide, modifie au besoin, et publie.

Chaque équipier reçoit ses shifts dans son calendrier téléphone via
un flux iCal personnel (Apple, Google, Outlook) avec notifications 2h
avant chaque service. Zéro app à installer.

## Stack technique

- **Front** : React 18 + Vite, i18next (FR/EN), Chart.js
- **Back** : Node.js 22 + Express 4, mysql2, bcrypt, JWT
- **DB** : MariaDB 10.11
- **Deploy** : Vercel (front) + Fly.io (back + DB dans un conteneur)

## Démarrage local

```bash
# Back
cd back
cp .env.example .env       # remplir DB_PASSWORD + JWT_SECRET
npm install
npm run migrate
npm run seed               # données démo "Bistrot du Vieux Port"
npm run dev                # http://localhost:3000

# Front (autre terminal)
cd front
echo "VITE_API_BASE=http://localhost:3000" > .env.local
npm install
npm run dev                # http://localhost:5173
```

## Comptes de démo (après seed)

| Email                        | Rôle              |
| ---------------------------- | ----------------- |
| julien.patron@bistrot.fr     | Patron (admin)    |
| sophie.manager@bistrot.fr    | Manager salle     |
| ahmed.chef@bistrot.fr        | Chef cuisine      |
| elena.serveuse@bistrot.fr    | Serveuse          |
| samir.plonge@bistrot.fr      | Plongeur          |

Mot de passe pour tous : `motdepasse123`.

## Auteur

Projet de soutenance AFPA — Titre Professionnel **Développeur Web et Web
Mobile** (RNCP31114). Centre de formation : Marseille La Treille.
Auteur : Vladimir Rodzaevskiy.

## Licence

MIT
