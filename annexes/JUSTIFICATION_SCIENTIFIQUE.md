# Justification scientifique du modèle de couverture Crew

> Annexe au dossier projet — Soutenance AFPA DWWM.
> Synthèse de la littérature peer-reviewed et des publications d'organismes
> publics (INRS, NIOSH, CDC) qui sous-tendent la modélisation du smart planner.

## Résumé exécutif

Le solver de Crew quantifie la couverture d'un service par une somme de
coefficients par poste (cuisine/salle), pondérée par le niveau d'expérience
des équipiers (Junior 50, Confirmé 100, Chef 150), avec trois paliers de
densité (Calme 50 %, Normal 100 %, Chargé 150 %). Cette structure n'est
pas arbitraire : elle s'appuie sur quatre corpus convergents.

1. **Sciences des opérations** — la vitesse de service est endogène à la
   charge (KC & Terwiesch, *Management Science* 2009).
2. **Santé au travail** — la surcharge produit du burnout qui dégrade la
   qualité de service (Grobelna, *J. Hospitality Marketing & Management*
   2021 ; Wen et al., *Frontiers in Psychology* 2020).
3. **Prévention institutionnelle** — INRS, NIOSH, OSHA reconnaissent la
   fatigue comme un risque mesurable (NIOSH 2023 ; INRS ED 880).
4. **Statistiques sectorielles françaises** — ratios staff/couverts et
   coûts personnels documentés (UMIH/CHR ; études Accor).

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

Ce rapport définit six familles de facteurs RPS, dont la **« quantité
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

## 6. Limites assumées et perspectives

Le modèle Crew est volontairement simple :

- **Pas de skill matrix** — un confirmé en salle ne peut pas dépanner
  en cuisine. Les modèles industriels (workforce flexibility) gèrent
  cette polyvalence ; intégration possible en V2.
- **Densité unique par service par jour** — pas de granularité
  intra-service (pic 12 h 30 vs 14 h en midi). La littérature
  (KC & Terwiesch) suggère une fenêtre K = 4 h ce qui couvre déjà un
  service entier.
- **Coefficients fixes par niveau** — un Junior très autonome n'est
  pas distingué d'un Junior débutant. Une calibration personnalisée
  par membre est possible (le solver accepte déjà un override par
  shift au niveau back-end).

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
