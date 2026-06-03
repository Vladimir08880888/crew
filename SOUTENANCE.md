# Soutenance — Crew

**Durée cible** : 12-15 min de présentation + 5-10 min de questions
**Public** : jury AFPA (formateur + professionnel + référent)

---

## 📋 Check-list AVANT la soutenance (J-1 et J-0)

### J-1 (la veille)
- [ ] Recharger l'ordinateur portable
- [ ] Tester `npm install` sur `back/` et `front/` depuis zéro (clone clean)
- [ ] Tester `npm run migrate && npm run seed` → 8 membres + 120+ shifts
- [ ] Vérifier `npm run dev` côté back ET front
- [ ] Lancer un smoke test : login `julien.patron@bistrot.fr` / `motdepasse123`
- [ ] Ouvrir Apple Calendar avec l'URL `localhost:3000/api/calendar/<token>`
      → confirmer l'affichage des shifts avec leur alarme 2h
- [ ] Préparer 4 onglets navigateur :
  1. `https://crew-planner-hazel.vercel.app/login` (déconnecté)
  2. README GitHub : `github.com/Vladimir08880888/crew`
  3. `CAHIER_DES_CHARGES.md` ouvert
  4. Code dans VS Code

### J-0 (juste avant)
- [ ] Démarrer MariaDB : `sudo systemctl start mariadb`
- [ ] Démarrer back : `cd back && npm run dev` (terminal 1)
- [ ] Démarrer front : `cd front && npm run dev` (terminal 2)
- [ ] Tester `http://localhost:5173` → page login s'affiche
- [ ] Connexion test : `sophie.manager@bistrot.fr` / `motdepasse123` → dashboard OK
- [ ] Fermer toutes autres apps (Discord, notifications) pour éviter pop-ups
- [ ] Mettre l'ordinateur en mode **« ne pas déranger »**
- [ ] Préparer le câble HDMI / adaptateur si projection
- [ ] Vérifier que la prod répond : `curl https://crew-back.fly.dev/health`

### Backup
- [ ] Captures d'écran prêtes dans `annexes/screenshots/` au cas où la démo plante
- [ ] Vidéo de démo enregistrée à l'avance (optionnel, ffmpeg)

---

## 🎬 Plan de présentation (slide-by-slide)

### Slide 1 — Page de titre (10 sec)
**Affiché** :
> **Crew**
> Planification d'équipe intelligente avec smart planner
>
> Soutenance de fin de formation — Développeur Web et Web Mobile
> Vladimir Rodzaevskiy — AFPA Marseille La Treille — *(date à définir)*

**À dire** :
> « Bonjour. Je vais vous présenter Crew, mon projet de fin de formation Développeur Web et Web Mobile. C'est une application web full-stack pour la planification de services d'équipe, avec un solver d'auto-planning qui respecte les heures contractuelles et envoie les services sur le téléphone de chaque équipier via le calendrier natif, sans aucune application à installer. »

---

### Slide 2 — Problème / Constat (1 min 30)
**Affiché** :
> **Le constat**
>
> - Tout responsable d'équipe à rotation (restauration, hôtellerie, retail,
>   sécurité…) passe **10-15 heures par mois** à faire des plannings sur
>   Excel ou papier.
> - Les outils SaaS existants (Skello, Combo, Snapshift) :
>   - €2-5 par employé par mois → vite onéreux
>   - Verticalisés à un seul secteur
>   - Notifications dépendantes d'une application installée
>
> **Hypothèse** : peut-on offrir le service essentiel (planning + sync
> calendrier) gratuitement, avec un solver vraiment utile ?

**À dire** :
> « J'ai 10 ans de restauration et 3 ans de casino derrière moi. Dans ces métiers, le planning hebdomadaire mange énormément de temps au manager : il faut équilibrer les heures contractuelles, éviter les jours consécutifs, respecter les préférences. Les outils SaaS existants sont chers, verticalisés, et nécessitent que chaque équipier installe leur application pour recevoir des notifications. Je me suis demandé si on pouvait offrir l'essentiel — la génération automatique du planning et l'envoi vers le calendrier — en s'appuyant sur des standards ouverts plutôt que sur du propriétaire. »

---

### Slide 3 — Solution proposée (1 min)
**Affiché** :
> **Crew**
>
> - Équipes avec rôles **manager / équipier** et permissions claires
> - Chaque équipier configuré une fois : **poste + shift habituel + heures contractuelles**
> - **Smart Planner** : un clic → planning hebdomadaire équilibré
> - **Notifications push natives** via le calendrier intégré du téléphone
> - **Sans application** à installer côté équipier
> - **Sans connexion** au site nécessaire après l'abonnement initial

**À dire** :
> « Crew gère une équipe avec deux rôles : manager et équipier. Le manager configure chaque membre une seule fois — poste, shift préféré, heures contractuelles. Ensuite, en un clic, le smart planner propose un planning hebdomadaire complet. Le manager valide ou ajuste, puis chaque équipier reçoit ses services dans son calendrier téléphone : Apple Calendar, Google Calendar, Outlook — peu importe. Avec une notification automatique 2 heures avant chaque shift. Aucune application à installer. »

---

### Slide 4 — Architecture (1 min)
**Affiché** :
> **Stack technique**
>
> | Couche  | Techno                                       |
> | ------- | -------------------------------------------- |
> | Front   | React 18 + Vite + i18next (FR/EN)            |
> | Back    | Node.js 22 + Express 4 + mysql2              |
> | DB      | MariaDB 10.11                                |
> | Auth    | JWT HS256 + bcrypt                           |
> | iCal    | RFC 5545 avec VALARM (notif native)          |
> | Deploy  | Vercel (front) + Fly.io (back + DB)          |
>
> **Communication** : REST JSON + JWT en `Authorization: Bearer …`

**À dire** :
> « Pour le front, React avec Vite — c'est rapide à builder et le DX est très bon. Internationalisation avec i18next, deux locales FR et EN synchronisées. Pour le back, Node.js 22 et Express 4, qui me permettent d'écrire un code asynchrone simple. La base de données est MariaDB, parce que je voulais du SQL pur, des contraintes d'intégrité strictes, et des migrations versionnées. L'authentification est faite avec JWT — stateless donc pas de session à stocker — et bcrypt pour les mots de passe. Pour la synchronisation calendrier, j'expose des flux iCal au format RFC 5545, qui est le standard ouvert lu nativement par Apple Calendar, Google Calendar et Outlook. Le déploiement est sur Vercel pour le front et Fly.io pour le back, avec une instance MariaDB co-localisée dans le même conteneur. »

---

### Slide 5 — Démo en direct (4-5 min)
**Plan de la démo** :

1. **Connexion** comme `sophie.manager@bistrot.fr`
2. **Dashboard** : montrer les heures par membre vs cible, prochains shifts
3. **Équipe** : ouvrir le détail du Bistrot, montrer les badges visuels
   (poste, shift, heures) sur chaque membre
4. **Setup d'un nouveau membre** : créer un compte, demander à rejoindre,
   approuver → le modal de setup s'ouvre automatiquement, montrer les
   3 étapes (heures contractuelles, poste, permissions)
5. **Planning** : navigation semaine suivante, vide
6. **Smart Planner** : clic sur « Générer », montrer le modal preview
   (heures par membre, slots non couverts, total). Appliquer.
7. **Stats** : montrer les 3 graphiques côté manager
8. **Sync calendrier** : profil → afficher le QR code, scanner avec
   l'iPhone (ou montrer Apple Calendar déjà abonné), pointer
   l'alarme 2h avant un shift

**Phrases-clés à dire pendant la démo** :
- « Vous voyez le liseré orange à côté de ce membre : son setup est
  incomplet. Le smart planner va l'ignorer tant que je n'ai pas
  renseigné ses heures. »
- « Le modal de génération montre exactement ce qui va être créé
  avant que je valide. C'est important : le manager garde la main. »
- « Ce slot non couvert apparaît en haut de la page tant qu'il n'est
  pas pourvu. C'est un rappel visuel, pas une simple notification
  qu'on peut louper. »

---

### Slide 6 — Smart Planner — algorithme (1 min 30)
**Affiché** :
> **Stratégie greedy multicritères**
>
> Pour chaque slot (date × shift_type × poste) à pourvoir :
>
> 1. Filtrer les membres déjà au max d'heures de la semaine → écartés
> 2. Filtrer les membres déjà sur 6 jours consécutifs → écartés
> 3. Pour chaque candidat restant, calculer un score :
>    - **+10** si `poste` du slot = `poste` habituel du membre
>    - **+5** si `shift_type` du slot = `shift_default` du membre
>    - **+20 × (1 − heures_planifiées / heures_cibles)**
>      (favorise les sous-occupés)
>    - **−5 × (jours_consécutifs)²** à partir du 5ᵉ jour
> 4. Prendre le candidat au meilleur score
> 5. Si aucun candidat → slot ajouté à la liste `uncovered`

**À dire** :
> « Le solver est un greedy avec scoring multicritères. À chaque slot à pourvoir, je filtre d'abord les membres qui sont déjà au-dessus de leur cible ou qui ont déjà travaillé 6 jours d'affilée — ils sont mis de côté pour respecter le droit du travail. Pour les candidats restants, je calcule un score : bonus si le poste correspond à leur poste habituel, bonus si le shift correspond à leur shift préféré, et un gros bonus s'ils sont encore loin de leur cible hebdomadaire. Je prends le meilleur score. Le solver est volontairement simple — pas de retour arrière, pas d'optimisation globale. La complexité reste linéaire et le manager voit le résultat en moins de 100 millisecondes. S'il n'aime pas, il modifie à la main puis dupliquera cette semaine la suivante. »

---

### Slide 7 — Sécurité (45 sec)
**Affiché** :
> **Mesures appliquées**
>
> - Mots de passe : **bcrypt** cost 10 (jamais en clair)
> - Sessions : **JWT** HS256, 7 jours, secret externe
> - Permissions : middleware RBAC sur **chaque** endpoint
> - CORS strict : liste blanche `FRONT_ORIGIN` (multi-domaines)
> - **Rate limiting** : 10 logins / 15 min / IP
> - Validation systématique côté back de toute donnée externe
> - HTTPS forcé en prod (Fly proxy + Vercel)
> - `trust proxy` à 1 pour bonne détection IP derrière Fly

---

### Slide 8 — Conception / Méthode (45 sec)
**Affiché** :
> **Approche projet**
>
> - **Phase 1** : analyse et cahier des charges (modèle de données
>   d'abord, parce qu'il porte la complexité métier)
> - **Phase 2** : back complet (migrations → models → controllers
>   → validators → routes → middleware d'auth)
> - **Phase 3** : front (auth, équipes, planning, smart planner, stats)
> - **Phase 4** : i18n, sync iCal, sécurisation
> - **Phase 5** : déploiement (Docker, Fly.io, Vercel)
> - **Phase 6** : tests manuels, écriture de la doc, captures
>
> Versioning : Git avec commits atomiques, push fréquent.

---

### Slide 9 — Difficultés et apprentissages (45 sec)
**Affiché** :
> **Points marquants**
>
> - **Solver** : trouver l'équilibre entre simple et utile. J'ai
>   commencé par une optimisation globale puis simplifié à un greedy.
> - **iCal RFC 5545** : le standard est verbeux, l'alarme `VALARM`
>   doit être parfaitement formée pour qu'iOS l'affiche.
> - **CORS multi-origines** : il a fallu passer d'une string à une
>   fonction `origin(cb)` pour supporter previews Vercel + prod.
> - **MariaDB dans le même conteneur** : pas idiomatique en prod
>   sérieuse, mais permet de tenir dans le free tier Fly.io.

---

### Slide 10 — Perspectives (30 sec)
**Affiché** :
> **Et après ?**
>
> - **Échanges de shifts entre équipiers** (workflow demande / acceptation)
> - **Pointage** : check-in QR à l'arrivée pour transformer planifié → réel
> - **Export Excel/PDF** pour archivage légal
> - **Multi-établissements** dans la même org
> - **Notifications push** Web Push pour les modifs de dernière minute

---

### Slide 11 — Merci & Questions
**Affiché** :
> **Merci de votre attention**
>
> Code : `github.com/Vladimir08880888/crew`
> Demo : `crew-planner-hazel.vercel.app`
>
> Questions ?

---

## ❓ Questions probables — réponses préparées

### Q1 — « Pourquoi avoir choisi un greedy plutôt qu'un solver optimisé (ILP, contraintes) ? »
> « Trois raisons. Premièrement, la complexité d'un ILP est exponentielle dans le pire cas, et la latence côté utilisateur compte beaucoup : si la génération prend 5 secondes, c'est perçu comme lent. Mon greedy tourne en moins de 100 ms. Deuxièmement, le manager veut garder la main : il préfère un planning correct qu'il ajuste à un planning « optimal » qu'il ne comprend pas. Troisièmement, le greedy est testable et débogable à la main — un atout important pour un projet de soutenance. »

### Q2 — « Pourquoi mettre MariaDB dans le même conteneur que Node ? »
> « Pour tenir dans le free tier de Fly.io qui limite à 3 machines de 256 MB en personnel. Co-localiser fait perdre la haute dispo mais évite le coût d'une instance dédiée. En production sérieuse, je séparerais : MariaDB managée chez PlanetScale ou Aiven, Node sur Fly. Le code n'a aucune dépendance à cette co-localisation — il suffirait de changer `DB_HOST` dans les secrets. »

### Q3 — « Pourquoi JWT plutôt que des sessions classiques ? »
> « Stateless, donc pas de stockage côté serveur — ça simplifie le scaling horizontal et évite une table de sessions. La contrepartie est l'invalidation : un JWT volé reste valide jusqu'à expiration. J'ai limité l'impact en mettant l'expiration à 7 jours et en gardant le secret rotable. Pour une vraie banque, j'utiliserais des refresh tokens ; ici l'arbitrage simplicité/sécurité me semble correct. »

### Q4 — « Comment garantir qu'un équipier ne peut pas voir le planning d'un autre ? »
> « Sur chaque endpoint qui retourne des shifts, un middleware vérifie l'appartenance à l'équipe via `family_members.status = 'active'`. Si le rôle est `child` (équipier), un filtre additionnel force `WHERE user_id = req.user.id`. Côté front, on n'affiche pas les shifts des autres dans la vue équipier — mais c'est cosmétique : la vraie barrière est côté back. »

### Q5 — « Comment fonctionne la sync calendrier exactement ? »
> « Le téléphone s'abonne à une URL HTTPS qui retourne un fichier `.ics`. Apple Calendar et Google Calendar vérifient cette URL automatiquement toutes les heures et mettent à jour l'agenda local. Chaque shift devient un événement avec une alarme `VALARM` `TRIGGER:-PT2H`. Le téléphone affiche la notification 2h avant, en natif, même si l'app Crew n'est jamais ouverte. Pas de push, pas d'app, pas de compte Apple ou Google supplémentaire. »

### Q6 — « Comment ajouteriez-vous le pointage / check-in ? »
> « Une nouvelle table `shift_checkins` avec FK sur `shifts`, et un endpoint POST `/shifts/:id/checkin` qui requiert un QR code éphémère affiché à l'entrée. Le manager voit les écarts planifié vs réel en stats. Aucun changement de schéma sur la table `shifts` — c'est une couche analytique au-dessus. »

### Q7 — « Le front charge un bundle JS de 530 kB, ce n'est pas un peu lourd ? »
> « Vous avez raison. Chart.js pèse à lui seul ~150 kB et n'est utile que sur l'écran stats. La prochaine itération sera un `React.lazy` autour de la page Stats pour que le bundle initial descende à ~380 kB. Je l'ai noté en perspective. »

### Q8 — « Pourquoi pas TypeScript ? »
> « Pour me concentrer sur l'aboutissement fonctionnel dans le délai de 2 mois. Sur un projet plus ambitieux ou en équipe je passerais à TypeScript — surtout pour les types partagés entre front et back via un package commun. »

---

## 🛟 En cas de problème pendant la démo

| Symptôme                         | Plan B                                                                   |
| -------------------------------- | ------------------------------------------------------------------------ |
| MariaDB ne démarre pas           | `sudo systemctl restart mariadb` puis `npm run migrate && npm run seed`  |
| Le front ne se charge pas        | Basculer sur la prod : `https://crew-planner-hazel.vercel.app`            |
| Le smart planner renvoie 500     | Recharger le seed (équipe vide → solver crash) : `npm run seed`          |
| Le calendrier mobile ne sync pas | Capture d'écran de l'iPhone déjà préparée dans `annexes/screenshots/`    |
| Tout crash                       | Reprendre sur slides + captures écran, expliquer le code dans VS Code    |
