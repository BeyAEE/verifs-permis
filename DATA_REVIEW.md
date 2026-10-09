# Points de données à valider

Les 100 fiches sont reprises **mot pour mot** de l'outil moniteur
(`beyaee/outil-moniteur`, commit `b186ea3`, bloc `const FICHES=[…]` de
`remc-moniteur.html`). Une vérification indépendante a confirmé **0 écart sur
4 755 contrôles** entre la source, les données du site et les 100 pages
publiées. Rien n'a été corrigé : ce document liste ce qui semble anormal dans
la source, pour que tu tranches.

**Pour corriger une fiche :** modifie-la dans l'outil moniteur, puis lance
`npm run import:fiches -- --commit <nouveau sha>`. Retire ensuite l'entrée
correspondante de ce document. Le test d'intégrité (CI) vérifie que le site
reste identique à la source.

Légende : ⚠️ à corriger probablement · 🔎 à vérifier · ℹ️ pour information.

## 1. Textes mélangés (extraction du PDF) — le site les affiche tels quels

| | Fiche | Problème |
|---|---|---|
| ⚠️ | **90** | Question et réponse mélangées ligne par ligne. Question actuelle : « Avec l'assistance de Vérification des feux, propres, en l'accompagnateur, bon état et fonctionnent contrôlez l'état, la propreté et le (toute anomalie doit être fonctionnement des feux de stop. » ; réponse : « signalée). » D'après la fiche jumelle 46, le texte attendu est probablement : question « Avec l'assistance de l'accompagnateur, contrôlez l'état, la propreté et le fonctionnement des feux de stop. », réponse « Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée). » |
| ⚠️ | **67** | Une phrase de la réponse s'est glissée dans la question : « Mettez le rétroviseur intérieur en position "nuit". **Si le rétroviseur de l'accompagnateur gène la manipulation du dispositif, l'explication suffit.** » La seconde phrase est le début de la réponse de la fiche jumelle 3. L'élève la voit donc avant d'avoir révélé la réponse. |

## 2. Doublons et incohérences entre fiches

| | Fiches | Problème |
|---|---|---|
| ⚠️ | **55** (avec 25 et 81) | « De quelle couleur est le voyant qui indique une défaillance du système de freinage. » C'est la seule vérification présente 3 fois, et la 55 finit par un point au lieu d'un « ? ». La 55 reprend aussi mot pour mot la question et la réponse de sécurité routière de la 25/81 ; seule la partie premiers secours diffère. C'est probablement une erreur de saisie : vérifie dans le PDF officiel. |
| 🔎 | **60** et **62** | Même vérification « Ouvrez et refermez le coffre, puis vérifiez sa bonne fermeture. », mais les questions de sécurité routière et de premiers secours sont différentes. Peut-être voulu ; à vérifier dans le PDF. |
| 🔎 | **99** (et 63) | « Montrez le voyant indiquant une baisse de pression d’air d’un pneumatique ? » : « ? » sur une consigne. La jumelle 63 dit « Montrez sur le tableau de bord le voyant […] pneumatique. » |
| 🔎 | **1** (et 65) | « Montrez la commande **De** réglage de hauteur des feux. » : majuscule parasite. La 65 l'écrit correctement. |
| 🔎 | **100** (et 66) | « Montrez où se situent les gicleurs de lave-glace avant **?** » : « ? » au lieu du point de la fiche 66. |
| 🔎 | **65** | La réponse de premiers secours n'a pas de point final (« …éviter un sur-accident »), alors que le même texte en a un dans les fiches 1, 38 et 86. |

## 3. Coquilles

| | Fiches | Texte | Proposition |
|---|---|---|---|
| ⚠️ | **7, 32, 71, 84** | Premiers secours : « …où **doitelle** être déplacée ? » | « doit-elle » |
| 🔎 | **5**, **69** | « Faites fonctionner les essuie-glaces **avants**… » | « essuie-glaces avant » (invariable) |
| 🔎 | **60** | Réponse sécurité routière : « …la hauteur des feux **avants**. » | « feux avant » |
| 🔎 | **38**, **86** | « …pour les pneumatiques **arrières**, véhicule chargé. » | « pneumatiques arrière » |
| 🔎 | **3** (réponse), **67** (question) | « …l'accompagnateur **gène** la manipulation… » | « gêne » |
| 🔎 | **61** | « Indiquez où **se situe** les attaches de type Isofix… » | « se situent » |
| 🔎 | **80** | « …par **Le** Signal d’Alerte et d’Information aux Populations… » | « le Signal » (comme en 22, 58, 98) |
| 🔎 | **24** | Premiers secours : « Car les lésions du cerveau**,** surviennent… » | sans virgule (comme en 50) |
| 🔎 | **19** | La réponse de sécurité routière commence par « Citez deux exemples. », qui ressemble à la consigne de la question. | à vérifier dans le PDF |
| 🔎 | **7, 8, 20, 70, 71, 78** | « Le terme **" gilet jaune"** peut être utilisé… » : espace après le guillemet ouvrant | « "gilet jaune" » |

Certaines de ces formulations figurent peut-être telles quelles dans le
document officiel : dans ce cas, garde-les.

## 4. Réponses de vérification absentes (55 fiches)

Ces fiches n'ont **pas de réponse écrite** pour la vérification dans la source,
le plus souvent parce que la réponse est un geste (montrer, actionner, ouvrir) :

5, 10, 11, 13, 15, 17, 23, 25, 27, 29, 31, 32, 33, 34, 35, 37, 38, 39, 41, 42,
43, 45, 47, 48, 49, 51, 53, 54, 55, 57, 58, 59, 60, 62, 64, 66, 69, 73, 75, 77,
81, 83, 84, 85, 86, 87, 88, 89, 91, 93, 94, 95, 97, 98, 100.

Sur le site, elles affichent « Pas de réponse écrite pour cette vérification :
il faut la faire ou la montrer sur la voiture. » Si le PDF officiel contient une
réponse pour certaines d'entre elles, ajoute-la dans l'outil moniteur, puis
réimporte. Le test d'intégrité vérifie la liste exacte : il faudra aussi la
mettre à jour dans `tests/unit/donnees.test.ts`.

## 5. Fiches jumelles qui divergent légèrement

Même vérification, mais un autre texte de la fiche diffère un peu. Ce n'est pas
forcément une erreur ; à harmoniser si tu le souhaites :

- **Réponses de vérification :** 7/71 (« indiquer » / « montrer ») ; 14/74 (une virgule) ; 52/92 (« et qui fonctionnent » / « et fonctionnent »).
- **Questions de sécurité routière :** 15/75 (« contrôler » / « compléter le niveau d'huile ») ; 21/79 (« . » / « ? »).
- **Premiers secours :** 14/74 (« conditions » / « précautions ») ; 26/82 (« Le déplacement de la victime » / « Ce déplacement ») ; 25/81 (« Hors autoroute… » / « En général… »).

## 6. Pour information (normal)

- ℹ️ Les fiches **impaires** sont toutes des vérifications intérieures et les
  **paires** des extérieures (50 / 50).
- ℹ️ En ignorant majuscules et ponctuation finale, 32 vérifications
  apparaissent deux fois (8 = 70, 12 = 72, 22 = 80…), une trois fois (25 / 55 /
  81) et 33 une seule fois. Une même zone sert aux fiches jumelles.
- ℹ️ Typographie hétérogène, probablement d'origine :
  - consignes « Citez… » finissant tantôt par « . », tantôt par « ? » ;
  - apostrophes droites et courbes mélangées ;
  - « Qu’est ce qu’ » (sans trait d'union) ;
  - « pare brise », « essuie glace » ;
  - « ALERTER: » sans espace ;
  - « A » sans accent en début de phrase.
