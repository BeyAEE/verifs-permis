# Points de données à valider

Les 100 fiches sont reprises **mot pour mot** de l'outil moniteur
(`beyaee/outil-moniteur`, commit `6132503`). Le test d'intégrité vérifie à
chaque build que le texte du site est identique, caractère par caractère, à
celui de l'outil.

L'outil a ensuite été comparé au **PDF officiel** (banque DSR du 1er janvier 2018,
copié dans `data/source/banque-verifications-2018.pdf`) : depuis la correction
d'octobre 2026, **les 545 textes sont identiques** au document officiel. Les
« coquilles » repérées dans les
fiches (« De » majuscule, « avants », « arrières », « gène », fiche 55 en
triple, fiches 60 et 62 identiques…) figurent **telles quelles dans le
document officiel** : l'outil les a recopiées fidèlement.

Légende : ✅ corrigé · 🔎 à vérifier · ℹ️ pour information.

## 1. Erreurs d'extraction (corrigées en octobre 2026)

Ce sont les **5 seuls textes** de l'outil qui ne correspondaient pas au PDF
officiel. Ils ont été corrigés dans l'outil moniteur (commit `6132503`), puis
réimportés ici : l'outil et le site affichent maintenant le texte officiel.

| | Fiche | Ancien texte de l'outil | Texte officiel (PDF), repris désormais |
|---|---|---|---|
| ✅ | **90** (question) | « Avec l'assistance de Vérification des feux, propres, en l'accompagnateur, bon état et fonctionnent contrôlez l'état, la propreté et le (toute anomalie doit être fonctionnement des feux de stop. » | « Avec l'assistance de l'accompagnateur, contrôlez l'état, la propreté et le fonctionnement des feux de stop. » |
| ✅ | **90** (réponse) | « signalée). » | « Vérification des feux, propres, en bon état et fonctionnent (toute anomalie doit être signalée). » |
| ✅ | **7, 32, 71, 84** (premiers secours) | « …où **doitelle** être déplacée ? » | « …où **doit-elle** être déplacée ? » |

Les particularités de la section 3, présentes dans le document officiel
lui-même, ont été volontairement gardées telles quelles.

## 2. Réponses en image dans le document officiel (désormais affichées)

Pour **22 vérifications intérieures**, la réponse officielle n'est pas un texte
mais le **pictogramme du voyant ou de la commande**. C'est pour cela que l'outil
moniteur, extrait en texte, avait une réponse vide pour ces fiches :

13, 15, 23, 25, 27, 29, 33, 37, 39, 43, 47, 51, 55, 57, 73, 75, 81, 83, 87, 89, 91, 95.

Ces pictogrammes sont maintenant extraits du PDF (`npm run pictogrammes`) et
affichés comme réponse sur le site. En entraînement QCU, ils servent aussi de
choix. Les 33 autres vérifications sans réponse écrite n'ont pas de réponse non
plus dans le PDF officiel :

5, 10, 11, 17, 31, 32, 34, 35, 38, 41, 42, 45, 48, 49, 53, 54, 58, 59, 60, 62,
64, 66, 69, 77, 84, 85, 86, 88, 93, 94, 97, 98, 100.

Sur le site, elles affichent « Pas de réponse écrite pour cette vérification :
il faut la faire ou la montrer sur la voiture », accompagné, quand il existe,
d'un repère propre à la Clio 5 de l'auto-école.

## 3. Particularités du document officiel (conformes, à garder ou non)

Ces points figurent **dans le PDF officiel** : le site les reproduit tels quels.

| | Fiches | Particularité |
|---|---|---|
| ℹ️ | **55** (avec 25 et 81) | Même vérification que 25 et 81, avec un point au lieu du « ? » ; la question de sécurité routière est aussi la même. |
| ℹ️ | **60** et **62** | Même vérification « Ouvrez et refermez le coffre… », mais les autres questions diffèrent. |
| 🔎 | **3** et **67** | La phrase « Si le rétroviseur de l'accompagnateur gène la manipulation du dispositif, l'explication suffit. » est une consigne pour l'examinateur (en bleu dans le PDF), placée dans la colonne de la question. Dans l'outil, elle est au début de la **réponse** pour la fiche 3 et dans la **question** pour la 67. |
| ℹ️ | 1 | « Montrez la commande **De** réglage… » (majuscule) |
| ℹ️ | 5, 69 / 60 / 38, 86 | « essuie-glaces **avants** » / « feux **avants** » / « pneumatiques **arrières** » |
| ℹ️ | 3, 67 | « **gène** » pour « gêne » |
| ℹ️ | 61 | « où **se situe** les attaches » |
| ℹ️ | 80 | « par **Le** Signal d’Alerte… » |
| ℹ️ | 99, 100 | Consigne terminée par « ? » |
| ℹ️ | 65 | Réponse de premiers secours sans point final |
| ℹ️ | 24 | « Car les lésions du cerveau**,** surviennent… » |
| ℹ️ | 19 | Réponse de sécurité routière commençant par « Citez deux exemples. » |
| ℹ️ | 7, 8, 20, 70, 71, 78 | « Le terme **" gilet jaune"** » : espace après le guillemet ouvrant |

Recommandation : garder le texte officiel. Le corriger éloignerait le site de ce
que l'élève peut lire ailleurs.

## 4. Pour information

- ℹ️ Les fiches **impaires** sont toutes des vérifications intérieures, les **paires** des extérieures.
- ℹ️ En ignorant majuscules et ponctuation finale, 32 vérifications apparaissent deux fois (8 = 70, 12 = 72, 22 = 80…), une trois fois (25 / 55 / 81) et 33 une seule fois.
- ℹ️ Fiches jumelles avec de petites différences de rédaction (officielles) : réponses 7/71, 14/74, 52/92 ; questions de sécurité 15/75, 21/79 ; premiers secours 14/74, 25/81, 26/82.
