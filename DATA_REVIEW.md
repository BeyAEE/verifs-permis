# Points de données à valider

Les 100 fiches sont reprises **mot pour mot** de l'outil moniteur
(`beyaee/outil-moniteur`, commit `b186ea3`, bloc `const FICHES=[…]` de
`remc-moniteur.html`). Rien n'a été corrigé : ce document liste ce qui semble
anormal pour que tu tranches.

**Pour corriger une fiche :** modifie-la dans l'outil moniteur, puis relance
`npm run import:fiches -- --commit <nouveau sha>`. Si une entrée de ce document
devient sans objet, supprime-la. Le test d'intégrité (CI) vérifie que le site
reste identique à la source.

Légende : ⚠️ à corriger probablement · 🔎 à vérifier · ℹ️ pour information.

## 1. Fiche mal extraite du PDF

| | Fiche | Problème |
|---|---|---|
| ⚠️ | **90** | Question et réponse mélangées, ligne par ligne, lors de l'extraction du PDF. Texte actuel de la question : « Avec l'assistance de Vérification des feux, propres, en l'accompagnateur, bon état et fonctionnent contrôlez l'état, la propreté et le (toute anomalie doit être fonctionnement des feux de stop. » ; réponse : « signalée). » D'après la fiche jumelle 46, le texte attendu est probablement : question « Avec l'assistance de l'accompagnateur, contrôlez l'état, la propreté et le fonctionnement des feux de stop. », réponse « Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée). » **Le site affiche aujourd'hui le texte mélangé.** |

## 2. Doublons et incohérences entre fiches

| | Fiches | Problème |
|---|---|---|
| ⚠️ | **55** (avec 25 et 81) | « De quelle couleur est le voyant qui indique une défaillance du système de freinage. » La même vérification apparaît 3 fois (25, 55, 81), et la 55 finit par un point au lieu d'un « ? ». C'est la seule vérification présente 3 fois parmi les 100 fiches (les autres apparaissent 1 ou 2 fois) : la 55 est sans doute une erreur de saisie. Vérifie dans le PDF officiel quelle vérification correspond à la fiche 55. |
| ⚠️ | **60** et **62** | Même vérification « Ouvrez et refermez le coffre, puis vérifiez sa bonne fermeture. » sur deux fiches consécutives : l'une des deux est probablement fausse. |
| 🔎 | **1** (et 65) | « Montrez la commande **De** réglage de hauteur des feux. » : majuscule parasite. La fiche jumelle 65 l'écrit correctement. |
| 🔎 | **100** (et 66) | « Montrez où se situent les gicleurs de lave-glace avant **?** » : « ? » au lieu du point. La fiche 66 finit par un point. |
| 🔎 | **65** | Réponse premiers secours sans point final (« …éviter un sur-accident »). Le même texte, fiche 1, se termine par un point. |

## 3. Coquilles

| | Fiches | Texte | Proposition |
|---|---|---|---|
| 🔎 | **5**, **69** | « Faites fonctionner les essuie-glaces **avants** du véhicule… » | « avant » est invariable : « essuie-glaces avant » |
| 🔎 | **60** | Réponse sécurité routière : « …régler la hauteur des feux **avants**. » | « feux avant » |
| 🔎 | **38**, **86** | « …pour les pneumatiques **arrières**, véhicule chargé. » | « arrière » est invariable : « pneumatiques arrière » |

Ces formulations figurent peut-être telles quelles dans le document officiel :
dans ce cas, garde-les.

## 4. Réponses de vérification absentes (55 fiches)

Ces fiches n'ont **pas de réponse écrite** pour la vérification dans la source,
le plus souvent parce que la réponse est un geste (montrer, actionner, ouvrir) :

5, 10, 11, 13, 15, 17, 23, 25, 27, 29, 31, 32, 33, 34, 35, 37, 38, 39, 41, 42,
43, 45, 47, 48, 49, 51, 53, 54, 55, 57, 58, 59, 60, 62, 64, 66, 69, 73, 75, 77,
81, 83, 84, 85, 86, 87, 88, 89, 91, 93, 94, 95, 97, 98, 100.

Sur le site, elles affichent « Pas de réponse écrite pour cette vérification :
il faut la faire ou la montrer sur la voiture. » Si le PDF officiel contient une
réponse pour certaines d'entre elles, ajoute-la dans l'outil moniteur puis
réimporte. Le test d'intégrité vérifie la liste exacte : il faudra la mettre à
jour dans `tests/unit/donnees.test.ts`.

## 5. Pour information (normal)

- ℹ️ Les fiches **impaires** sont toutes des vérifications intérieures et les
  **paires** des extérieures (50 / 50).
- ℹ️ 31 vérifications apparaissent deux fois (8 = 70, 12 = 72, 22 = 80…) et
  35 une seule fois. Une même zone sert aux deux fiches jumelles.
- ℹ️ Les questions « Citez… » se terminent par un point, ce qui est correct pour
  une consigne. Aucune correction nécessaire.
