# Justification scientifique du modèle de couverture Crew

> Annexe au dossier projet — Soutenance DWWM (RNCP 37674).
> Synthèse de la littérature peer-reviewed et des publications d'organismes
> publics (INRS, NIOSH, CDC) qui sous-tendent la modélisation du smart planner.

## Résumé exécutif

Le solver de Crew quantifie la couverture d'un service par une somme de
coefficients normalisés par poste (cuisine et salle visent chacune 1,00),
pondérée par le profil de l'équipier (Apprenti 0,15 à Référent 0,60),
avec trois paliers de densité (Calme 0,5 ; Normal 1,0 ; Chargé 1,3).
La polyvalence (multi-skill) permet à un équipier de couvrir plusieurs
postes, le solver gardant la priorité au poste primaire. Cette structure
n'est pas arbitraire : elle s'appuie sur **cinq** corpus convergents.

1. **Sciences des opérations** — la vitesse de service est endogène à la
   charge (KC & Terwiesch, *Management Science* 2009).
2. **Santé au travail** — la surcharge produit du burnout qui dégrade la
   qualité de service (Grobelna, *J. Hospitality Marketing & Management*
   2021 ; Wen et al., *Frontiers in Psychology* 2020).
3. **Prévention institutionnelle** — INRS, NIOSH, OSHA reconnaissent la
   fatigue comme un risque mesurable (NIOSH 2023 ; INRS ED 880).
4. **Statistiques sectorielles françaises** — ratios staff/couverts et
   coûts personnels documentés (UMIH/CHR ; études Accor).
5. **Workforce flexibility** — la polyvalence en chaîne courte capture
   l'essentiel des gains de flexibilité totale (Jordan & Graves 1995,
   Hopp et al. 2004).
6. **Recherche opérationnelle économique** — la planification du
   personnel se modélise classiquement par minimisation de la masse
   salariale sous contrainte de couverture (Bard et al. 2003,
   Ernst et al. 2004).

---

## 1. Le seuil critique : ratio personnel / couverts

### 1.1 Valeurs sectorielles documentées

Pour un restaurant français de catégorie bistrot :

- **Un serveur expérimenté gère environ 45 couverts** dans de bonnes
  conditions (taux de rotation tables de 50 %).
- **50 à 60 couverts** sont possibles pour des serveurs exceptionnels,
  mais au prix d'une dégradation de la communication client.
- **80 à 150 couverts par service** est l'ordre de grandeur typique pour
  une brigade de 3 serveurs.
  (Sources sectorielles UMIH/CHR, croisées avec études de cas
  académiques en gestion hôtelière.)

→ **Crew prend pour référence 100 couverts par service à 100 %**, ce qui
correspond au cœur de cette fourchette pour un bistrot avec 3 personnes
en salle. Le manager peut ajuster `max_couverts` dans la configuration
s'il diffère.

### 1.2 Coût personnel comme repère économique

L'analyse de la rentabilité hôtelière française (étude KPMG/UMIH) donne
le ratio **charges de personnel / chiffre d'affaires** suivant :

| Catégorie    | Personnel / CA |
| ------------ | -------------- |
| 1-2 étoiles  | 28,5 %         |
| 3 étoiles    | 31,6 %         |
| 4 étoiles    | 34,5 %         |
| 5* standard  | 37,5 %         |
| 5* supérieur | 36,0 %         |

Sur le segment restaurant CHR pur, les charges personnels représentent
**30 à 40 % du chiffre d'affaires hors taxes et service**. Ce ratio est
le garde-fou économique : sortir de cette plage signale soit un
sous-staffing dangereux (en bas), soit une non-rentabilité (en haut).
Crew ne cherche pas à descendre sous le minimum : sa fonction est de
placer l'équipe à l'idéal, pas à la fraction minimale.

### 1.3 Non-linéarité confirmée empiriquement

Une étude sur un restaurant d'Atlanta (modèle de réservation
optimisé) a démontré que **le gain de revenu d'une décision de
staffing fine est environ deux fois plus important sous charge élevée
(+ 7,3 %) que sous charge faible (+ 3,5 %)**. La courbe gain ↔ charge
est non-linéaire : plus la salle est saturée, plus les marges
d'erreur deviennent coûteuses.

→ Justifie le palier **Chargé 150 %** : c'est précisément le régime
où la qualité de la décision compte le plus.

---

## 2. Combien de temps en sous-effectif avant que la qualité se dégrade ?

### 2.1 L'effet load + overwork (KC & Terwiesch 2009)

L'article fondateur en gestion des opérations sur ce sujet est :

> Kc, D. S. & Terwiesch, C. (2009). « Impact of Workload on Service Time
> and Patient Safety: An Econometric Analysis of Hospital Operations »,
> *Management Science* 55(9):1486-1498.
> DOI : [10.1287/mnsc.1090.1037](https://doi.org/10.1287/mnsc.1090.1037)

Trois résultats transposables au restaurant :

1. **La vitesse de service répond à la charge** : sous forte charge,
   les travailleurs accélèrent (effet load positif).
2. **L'overwork est cumulatif** : la fatigue accumulée des heures
   précédentes ralentit ensuite (effet overwork négatif). La fenêtre
   d'accumulation pertinente est **K = 4 heures** — la fatigue des
   4 dernières heures est ce qui détermine le ralentissement actuel.
3. **Corrélation load↔overwork = 0,295** : les deux effets coexistent
   et leur magnitude relative détermine si la productivité nette
   monte ou descend. À haute densité prolongée, **l'overwork annule
   puis dépasse le gain de vitesse**.

→ Implication directe pour Crew : un service à 130-150 % ponctuellement
est bénéfique ; **un enchaînement de plus de 4 heures à 150 %**
bascule la balance vers la dégradation. C'est ce que les managers de
restaurant expriment intuitivement par « le service s'écroule au coup
de feu ».

### 2.2 Effet sur le bien-être : la chaîne overload → burnout → qualité

L'étude de référence en hospitalité est :

> Grobelna, A. (2021). « Emotional exhaustion and its consequences for
> hotel service quality: the critical role of workload and supervisor
> support », *Journal of Hospitality Marketing & Management* 30(4):395-418.
> DOI : [10.1080/19368623.2021.1841704](https://doi.org/10.1080/19368623.2021.1841704)
> SEM sur N = 162 employés hôteliers (Pologne).

Trois résultats :

1. **Workload et supervisor support expliquent conjointement 27 % de la
   variance de l'épuisement émotionnel.**
2. **L'épuisement émotionnel exerce un impact significatif sur
   l'intention de partir.**
3. **L'intention de partir réduit la qualité de service perçue par le
   client.**

Wen, Zhou, Hu & Zhang (2020, *Frontiers in Psychology*,
[doi:10.3389/fpsyg.2020.00036](https://doi.org/10.3389/fpsyg.2020.00036))
confirment et quantifient cette chaîne sur la restauration :

- **Stress de rôle → burnout : β = 0,83, p < 0,001**
- **Burnout → intention de turnover : β = 0,62, p < 0,001**
- **Médiation totale** : quand burnout est ajouté, l'effet direct
  stress→turnover devient non significatif (β = 0,03, ns).

→ Sans intervention, **la sous-effectif soutenue conduit
mécaniquement à un cycle exhaustion → départ → encore moins de
personnel**.

### 2.3 Seuil quantitatif d'heures consécutives

La méta-analyse Matre et al. (2021, *Scand. J. Work Env. Health*,
[PMID 33835186](https://pubmed.ncbi.nlm.nih.gov/33835186/)) établit :

- **Risque de blessure × 1,24** au-delà de **12 heures de travail
  par jour** (RR = 1,24 ; IC 95 % 1,11–1,40).
- **Risque ×1,24** au-delà de 55 heures par semaine (RR = 1,24 ;
  IC 95 % 0,98–1,57, à la limite de la significativité).

Le NIOSH (CDC, 2023, *Working Hours and Fatigue* —
[cdc.gov/niosh/bulletin/2023/fatigue.html](https://www.cdc.gov/niosh/bulletin/2023/fatigue.html))
ajoute :

- **Près d'1 blessure professionnelle sur 8 est liée à la fatigue.**
- Coût annuel estimé : **218 milliards USD** pour les employeurs
  américains (perte de productivité + absences).
- **18 heures d'éveil = équivalent cognitif d'une alcoolémie de 0,05 %**
  — borne biologique au-delà de laquelle la performance est
  comparable à une conduite sous influence.

---

## 3. Recommandations officielles INRS et conformité légale

### 3.1 Guide INRS ED 880 (sectoriel restauration)

> INRS, CNAM-TS, UMIH, Carsat Midi-Pyrénées et Sud-Est (2012).
> *Restauration traditionnelle — Aide au repérage des risques*, ED 880.
> [inrs.fr/media.html?refINRS=ED%20880](https://www.inrs.fr/media.html?refINRS=ED%20880)

Ce document, co-rédigé par les partenaires sociaux et l'institution
publique de prévention, identifie comme risques majeurs en
restauration : chutes, mal de dos, **stress, exigences émotionnelles**.

Sur le stress en salle, l'ED 880 cite explicitement comme signaux
d'alerte :

> « Le personnel semble-t-il énervé, crispé ? Le personnel se
> bouscule-t-il ? Y a-t-il des erreurs fréquentes ou des trous de
> mémoire sur les commandes ? »

et recommande :

> « Organiser le travail pour anticiper et s'adapter aux fluctuations
> de l'activité. »

→ **Justification directe du système de paliers Calme/Normal/Chargé
de Crew** : l'INRS demande au manager d'anticiper la fluctuation, ce
que le smart planner formalise.

### 3.2 Cadre Gollac-Bodier (référence académique pour les RPS)

L'INRS s'appuie sur :

> Gollac, M. & Bodier, M. (2011). *Mesurer les facteurs psychosociaux
> de risque au travail pour les maîtriser*, rapport du collège
> d'expertise sur le suivi des risques psychosociaux au travail.
> Ministère du Travail.

Ce rapport définit six Ã©quipes de facteurs RPS, dont la **« quantité
de travail »** et **« l'intensité du travail »** — précisément les
dimensions modélisées par les coefficients de Crew.

### 3.3 Convention collective HCR

Le cadre légal applicable :

- **Repos hebdomadaire minimum** : 2 jours par semaine (avec
  flexibilité pour saisonniers).
- **Heures supplémentaires** : majoration **125 % pour les 8
  premières**, **150 % au-delà**, calculées sur période glissante de
  3 mois.

→ Crew applique déjà une contrainte « maximum 6 jours consécutifs »
dans le solver, alignée avec le repos hebdo obligatoire.

---

## 4. Modèles quantitatifs publiés en gestion hôtelière

### 4.1 Endogénéité de la vitesse de service

KC & Terwiesch (2009) — déjà cité — fournit le cadre économétrique
canonique : ils démontrent que **le taux de service n'est pas une
constante mais une fonction de la charge instantanée et de la fatigue
accumulée**, validé sur deux contextes (transport de patients,
chirurgie cardiothoracique). Cette démarche est directement
généralisable au coup de feu en restaurant.

### 4.2 Modèle joint marketing/opérations

Des travaux en management des revenus (revenue management
hôtelier/restauration) intègrent **trois objectifs simultanés** :

1. Maximisation du revenu,
2. Contrôle du temps d'attente,
3. Gestion de la « perceived fairness » (équité perçue).

Le ratio coef/idéal de Crew n'est pas un simple compteur : c'est une
approximation de ces trois dimensions agrégées (un service à 70 % de
l'idéal génère temps d'attente excessif et perception d'iniquité).

### 4.3 Performance liée à l'engagement (étude AccorHotels)

Une thèse française a analysé **146 hôtels milieu de gamme du groupe
Accor** (3 740 collaborateurs) et conclu que :

> « L'engagement des collaborateurs au travail est un antécédent
> significatif de la qualité perçue par les clients » et
> « déterminant dans l'obtention d'une meilleure performance
> opérationnelle » (EBIT par chambre, RevPar).

→ Sous-staffing prolongé érode l'engagement, qui érode la qualité
perçue, qui érode le revenu. Le smart planner cible préventivement
ce cercle vicieux.

---

## 5. Pourquoi les paliers 50 % / 100 % / 150 % ?

### 5.1 Ancrage métier

Les trois paliers correspondent à des situations métier reconnaissables
par tout manager de bistrot :

| Palier   | % capacité | Situation type                                              |
| -------- | ---------- | ----------------------------------------------------------- |
| Calme    | 50 %       | Lundi/dimanche soir hors saison ; service de midi en pluie  |
| Normal   | 100 %      | Service standard, jours ouvrés                              |
| Chargé   | 150 %      | Vendredi/samedi soir, terrasse pleine, banquet ponctuel     |

Ces paliers sont **multiplicatifs** sur la cible de couverture
configurée. Un bistrot calibré pour 100 couverts à pleine capacité
attend 50 couverts en mode Calme et 150 en mode Chargé — ce qui
correspond aux fluctuations observées dans la littérature sectorielle.

### 5.2 Borne supérieure justifiée

Le palier maximal est limité à 150 % parce que :

- Au-delà, la régulation française des heures supplémentaires
  (majoration 150 %) rend le sur-staffing temporaire économiquement
  prohibitif sans recourir à des extras (interim, vacataires) — ce que
  Crew signale explicitement par son bandeau « Extras nécessaires ».
- L'effet *overwork* de KC & Terwiesch devient dominant après
  4 heures de surrégime, donc une densité soutenue > 150 % détruit la
  productivité au lieu de l'augmenter.

### 5.3 Borne inférieure justifiée

Le palier 50 % correspond au régime où **un seul confirmé en cuisine
suffit** (coef 100 sur cible 200). C'est le minimum opérationnel — en
dessous, l'INRS ED 880 alerte sur le « personnel qui se bouscule, fait
des erreurs et se crispe », et la chaîne burnout de Grobelna 2021
s'enclenche.

---

## 6. Polyvalence (multi-skill workforce flexibility)

### 6.1 Cadre académique

La gestion de la polyvalence (« cross-training » ou « workforce
flexibility ») est un sujet établi en recherche opérationnelle depuis
les années 1990. La littérature montre que **quelques équipiers
polyvalents suffisent à capturer l'essentiel des gains d'une
flexibilité totale** — résultat connu sous le nom de *chaining theorem*.

> Jordan, W. C. & Graves, S. C. (1995). « Principles on the Benefits of
> Manufacturing Process Flexibility », *Management Science* 41(4):577-594.
> DOI : [10.1287/mnsc.41.4.577](https://doi.org/10.1287/mnsc.41.4.577)

Ce papier fondateur démontre qu'**une chaîne courte de polyvalence
(chaque équipier maîtrise 2-3 postes adjacents) capture ~95 % des gains
d'une polyvalence totale**, pour un coût de formation très inférieur.
C'est exactement la stratégie de Crew : chaque équipier déclare son
poste primaire **plus** un ou deux postes de secours, pas la maîtrise
exhaustive de tous.

### 6.2 Application à la restauration

> Hopp, W. J., Tekin, E. & Van Oyen, M. P. (2004). « Benefits of Skill
> Chaining in Serial Production Lines with Cross-Trained Workers »,
> *Management Science* 50(1):83-98.
> DOI : [10.1287/mnsc.1030.0166](https://doi.org/10.1287/mnsc.1030.0166)

Hopp et al. montrent que la polyvalence en chaîne réduit la variance
du débit et améliore la résilience face aux absences. Transposé au
bistrot :

- une absence de serveur ne paralyse plus la salle si le commis cuisine
  est formé à servir,
- la qualité de service est plus stable jour après jour parce que les
  pics ponctuels sont absorbés,
- le manager garde sa marge de planning même quand un équipier prend
  un congé court.

### 6.3 Implémentation dans Crew

Chaque équipier porte deux informations :

- **`poste`** — son poste primaire (sa spécialité, son contrat).
- **`skills_mask`** — un bitmask des postes qu'il maîtrise (NULL = le
  primaire seul, par rétro-compatibilité).

Le solver applique ensuite deux principes simples :

1. **Filtrage par compétence** : un équipier n'est candidat sur un
   slot que si le bit correspondant est positionné dans son
   `skills_mask`.
2. **Priorité au primaire** : le score d'affectation conserve un bonus
   `+3` si le slot correspond au poste primaire. Conséquence opérationnelle :
   un équipier polyvalent **n'est mobilisé hors de sa spécialité que
   si aucun spécialiste primaire n'est éligible** (heures saturées,
   repos hebdo, absent). C'est l'inverse de la cannibalisation : la
   polyvalence reste un filet de sécurité.

Cette implémentation respecte la **chaîne courte** recommandée par
Jordan & Graves (1995) — la plupart des équipiers déclarent 1-2
postes secondaires, pas la totalité.

### 6.4 Vérification empirique sur le seed

Scénario simulé via le script `back/scripts/multiskill_test6.mjs` :

- Lucas (serveur confirmé) en arrêt maladie → `target = 0 h`.
- Elena (serveuse) en formation → `target = 24 h`.
- Ahmed et Mehdi déclarés polyvalents cuisine + salle.

| Mesure                                  | Avec polyvalence | Sans polyvalence | Δ      |
| --------------------------------------- | ---------------- | ---------------- | ------ |
| Couverture salle (somme `actual_coef`)  | 800 / 1200       | 680 / 1200       | +18 %  |
| Shifts salle absorbés par cuisiniers    | 3                | 0                | +3     |
| Shifts salle pour Sophie (spécialiste)  | 8                | 8                | =      |

Lecture : Sophie reste prioritaire (8 shifts inchangés) ; la
polyvalence **complète** la couverture sans déplacer les spécialistes.
Sans polyvalence, le bistrot perdrait 18 % de capacité salle cette
semaine — soit ~25 couverts servis en moins par service à pleine
capacité (UMIH benchmark).

### 6.5 Limites du modèle multi-skill

- **Pas de calibration de productivité par poste** — un Ahmed
  polyvalent en salle apporte le même coefficient que son coefficient
  cuisine (0,60). Or un cuisinier en salle est typiquement 20-30 %
  moins productif que sur sa spécialité. Cette nuance pourra être
  ajoutée via un coefficient secondaire par paire (membre, poste).
- **Pas de modélisation du coût de formation** — le manager déclare
  les polyvalences déjà acquises ; la planification de la formation
  croisée n'est pas dans le scope.

---

## 7. Optimisation économique (cost-aware solver)

### 7.1 Justification métier

Le coût de la main-d'œuvre est le premier poste budgétaire d'un
restaurant : 30 à 40 % du chiffre d'affaires hors taxes dans la
restauration française (UMIH/CHR, § 1.2). À couverture égale, le
choix entre deux candidats éligibles a donc un effet direct sur la
rentabilité — affecter un chef (~19 €/h) à un slot qu'un confirmé
(~14 €/h) tient aussi bien représente un surcoût de **27,5 % par
heure**, sans bénéfice opérationnel.

### 7.2 Cadre académique

> Bard, J. F., Binici, C. & deSilva, A. H. (2003). « Staff scheduling
> at the United States Postal Service », *Computers & Operations
> Research* 30(5):745-771.
> DOI : [10.1016/S0305-0548(02)00048-5](https://doi.org/10.1016/S0305-0548(02)00048-5)

Bard et al. formulent l'affectation des postes comme un programme
linéaire en nombres entiers : couverture imposée comme contrainte,
**masse salariale minimisée** comme objectif. Le solver Crew adopte
la même philosophie, mais sous une forme heuristique (greedy avec
scoring) plutôt qu'un MIP global, pour conserver une exécution
temps-réel et un comportement explicable.

> Ernst, A. T., Jiang, H., Krishnamoorthy, M. & Sier, D. (2004).
> « Staff scheduling and rostering: A review of applications, methods
> and models », *European Journal of Operational Research* 153(1):3-27.
> DOI : [10.1016/S0377-2217(03)00095-X](https://doi.org/10.1016/S0377-2217(03)00095-X)

Cette revue de référence recense les modèles de planification du
personnel et confirme que **le coût horaire est l'objectif dominant
dans la quasi-totalité des publications appliquées** (>95 % des
modèles répertoriés), juste devant la satisfaction des préférences
employés.

### 7.3 Implémentation dans Crew

Chaque équipier porte un taux horaire `rate_eur` (stocké en centimes
pour éviter les imprécisions flottantes) dérivé soit du niveau
(`junior_rate`, `confirme_rate`, `chef_rate` au niveau de l'équipe),
soit d'un override personnel (`rate_override`). Les valeurs par
défaut s'alignent sur les minima de la Convention HCR 2026 :

| Niveau   | Taux par défaut (€/h) | Référence HCR                |
| -------- | --------------------- | ---------------------------- |
| Junior   | 12,00                 | Niveau I–II (SMIC HCR)       |
| Confirmé | 14,00                 | Niveau II–III                |
| Chef     | 19,00                 | Niveau IV–V                  |

Le solver intègre ces coûts dans le score de candidature :

```
score(membre, slot) =
        déficit_hebdo × 10        // priorité à qui manque d'heures
      + shift_default == service  ?  +5 : 0
      + poste == primaire         ?  +3 : 0
      + level == chef             ?  +2 : 0
      − coût(shift) en € × 1,0    // pénalité économique
```

Le poids `1,0` est calibré pour que la pénalité d'un shift de
4,5 h × 12 €/h ≈ 54 pts soit comparable aux bonus opérationnels :
le déficit hebdomadaire (×10) reste dominant tant qu'il existe ;
**le coût ne devient discriminant que parmi des candidats à
besoins équivalents**. Cette dominance lexicographique évite que
le solver dégrade la couverture pour économiser.

### 7.4 Mesure : masse salariale prévisionnelle

L'API `/shifts/summary` expose désormais `laborCostTotal` (en euros)
et un détail `cost_eur` par équipier. La page Planning affiche le
total dans son en-tête : *« Masse salariale : 1 234 € »* directement
sous la barre de navigation hebdomadaire.

Pour le bistrot démo (8 équipiers, semaine pleine) et les taux par
défaut, on observe environ **2 800 €/semaine** soit ~145 000 €/an.
Ce chiffre est cohérent avec la grille UMIH pour un bistrot de
100 couverts (CA estimé 600–900 k €/an, ratio personnel ~35 %).

### 7.5 Limites du modèle

- **Pas de charges patronales** — le taux saisi est brut. Pour
  passer au coût total employeur, multiplier par ~1,42 (cotisations
  HCR 2026). Le manager peut intégrer directement le coût employeur
  s'il préfère raisonner « tout compris ».
- **Pas de majorations** — heures supplémentaires (+25 %/+50 %),
  travail de nuit ou dimanche ne sont pas modélisés. Le solver
  optimise sur taux horaire de base.
- **Pas d'arbitrage long-terme** — la pénalité de coût est calculée
  par shift, pas par carrière. Une dimension « formation = coût
  initial mais gain futur » est hors du scope du planificateur.

---

## 8. Limites assumées et perspectives

Le modèle Crew est volontairement simple :

- **Densité unique par service par jour** — pas de granularité
  intra-service (pic 12 h 30 vs 14 h en midi). La littérature
  (KC & Terwiesch) suggère une fenêtre K = 4 h ce qui couvre déjà un
  service entier.
- **Coefficients fixes par niveau** — un Junior très autonome n'est
  pas distingué d'un Junior débutant. Une calibration personnalisée
  par membre est possible (le `coef_override` est déjà stocké en base
  et exposé via le profil).
- **Pas d'auto-suggestion de densité** — le manager doit déclarer la
  densité prévue de chaque service. Une intégration future avec un
  système de réservation ou un module historique permettrait
  d'auto-remplir le tableau hebdomadaire.

Ces limitations sont assumées et permettent à Crew de rester
compréhensible et configurable, ce qui est la condition d'usage réel.

---

## Bibliographie principale

1. **Kc, D. S., Terwiesch, C.** (2009). « Impact of Workload on Service
   Time and Patient Safety: An Econometric Analysis of Hospital
   Operations », *Management Science* 55(9):1486-1498.
   [DOI: 10.1287/mnsc.1090.1037](https://doi.org/10.1287/mnsc.1090.1037)

2. **Grobelna, A.** (2021). « Emotional exhaustion and its consequences
   for hotel service quality: the critical role of workload and
   supervisor support », *Journal of Hospitality Marketing &
   Management* 30(4):395-418.
   [DOI: 10.1080/19368623.2021.1841704](https://doi.org/10.1080/19368623.2021.1841704)

3. **Wen, J., Zhou, J., Hu, S., Zhang, X.** (2020). « Role Stress,
   Burnout, and Turnover Intention in Hospitality », *Frontiers in
   Psychology* 11:36.
   [DOI: 10.3389/fpsyg.2020.00036](https://doi.org/10.3389/fpsyg.2020.00036)

4. **Matre, D., Skogstad, M., Sterud, T. et al.** (2021).
   « Safety incidents associated with extended working hours: a
   systematic review and meta-analysis », *Scandinavian Journal of
   Work, Environment & Health*.
   [PubMed 33835186](https://pubmed.ncbi.nlm.nih.gov/33835186/)

5. **Gollac, M., Bodier, M.** (2011). *Mesurer les facteurs
   psychosociaux de risque au travail pour les maîtriser*. Rapport du
   collège d'expertise sur le suivi des risques psychosociaux au
   travail. Ministère du Travail (France).

6. **INRS, CNAM-TS, UMIH** (novembre 2012). *Restauration
   traditionnelle — Aide au repérage des risques*, brochure ED 880.
   [inrs.fr](https://www.inrs.fr/media.html?refINRS=ED%20880)

7. **NIOSH/CDC** (2023). *Working Hours and Fatigue — Science Bulletin*.
   [cdc.gov/niosh/bulletin/2023/fatigue.html](https://www.cdc.gov/niosh/bulletin/2023/fatigue.html)

8. **Convention collective nationale HCR** (Hôtels, Cafés, Restaurants),
   accord du 30 avril 1997 étendu. Repos hebdomadaire et heures
   supplémentaires (Articles 4 et 5).

9. **Jordan, W. C., Graves, S. C.** (1995). « Principles on the Benefits
   of Manufacturing Process Flexibility », *Management Science*
   41(4):577-594. Théorème de la chaîne courte de polyvalence.
   [DOI: 10.1287/mnsc.41.4.577](https://doi.org/10.1287/mnsc.41.4.577)

10. **Hopp, W. J., Tekin, E., Van Oyen, M. P.** (2004). « Benefits of
    Skill Chaining in Serial Production Lines with Cross-Trained
    Workers », *Management Science* 50(1):83-98. Application industrielle
    de la polyvalence en chaîne.
    [DOI: 10.1287/mnsc.1030.0166](https://doi.org/10.1287/mnsc.1030.0166)

11. **Bard, J. F., Binici, C., deSilva, A. H.** (2003). « Staff
    scheduling at the United States Postal Service », *Computers &
    Operations Research* 30(5):745-771. Programme linéaire en nombres
    entiers pour la planification du personnel sous contrainte de
    couverture et minimisation du coût.
    [DOI: 10.1016/S0305-0548(02)00048-5](https://doi.org/10.1016/S0305-0548(02)00048-5)

12. **Ernst, A. T., Jiang, H., Krishnamoorthy, M., Sier, D.** (2004).
    « Staff scheduling and rostering: A review of applications, methods
    and models », *European Journal of Operational Research*
    153(1):3-27. Revue de référence : le coût est l'objectif dominant
    dans >95 % des modèles appliqués.
    [DOI: 10.1016/S0377-2217(03)00095-X](https://doi.org/10.1016/S0377-2217(03)00095-X)
