# Couverture photos — mode « Trouve l’élément »

> Fichier généré par `npm run couverture` : ne pas modifier à la main.

Une fiche passe en mode « Trouve l’élément » pour une voiture quand **trois conditions** sont réunies : la fiche est dans la liste des fiches localisables, la photo est publiée (`npm run images`), et la zone est au statut `valide`. Sinon, elle reste en mode classique (réponse + auto-évaluation), sans rien casser.

## 1. Fiches localisables (liste à valider)

Vérifications extérieures qui demandent de **montrer, indiquer, désigner ou ouvrir** un élément. Fichier : `src/data/localisables.json` (le texte des fiches n’est pas touché).

| Fiche | Élément à trouver | Photo nécessaire | Question |
|---|---|---|---|
| 2 | Bocal de lave-glace (remplissage) | moteur | Montrez où s'effectue le remplissage du produit lave-glace. |
| 8 | Bocal de liquide de frein | moteur | Montrez où s'effectue le contrôle du niveau du liquide de frein. |
| 12 | Vase d'expansion (liquide de refroidissement) | moteur | Montrez où s'effectue le remplissage du liquide de refroidissement. |
| 22 | Jauge à huile | moteur | Montrez où doit s'effectuer le contrôle du niveau d'huile moteur. |
| 24 | Batterie | moteur | Montrez l'emplacement de la batterie du véhicule. |
| 32 | Repère du témoin d'usure | pneu | Sur le flanc d’un pneumatique, désignez le repère du témoin d'usure de la bande de roulement. |
| 34 | Trappe à carburant | flanc | Ouvrez la trappe à carburant et/ou vérifiez la bonne fermeture du bouchon. |
| 36 | Bouchon de remplissage d'huile | moteur | Montrez où s'effectue le remplissage de l'huile moteur. |
| 42 | Sécurité enfant | portiere-arriere | Indiquez où se situe la sécurité enfant sur l'une des portières à l’arrière du véhicule. |
| 50 | Orifice de remplissage du lave-glace | moteur | Montrez l'orifice de remplissage du produit lave-glace. |
| 56 | Accès aux ampoules avant | moteur | Montrez où s'effectue le changement d'une ampoule à l'avant du véhicule. |
| 58 | Accès aux ampoules arrière | coffre | Montrez où s'effectue le changement d'une ampoule à l'arrière du véhicule. |
| 66 | Gicleurs de lave-glace avant | capot | Montrez où se situent les gicleurs de lave-glace avant. |
| 70 | Bocal de liquide de frein | moteur | Montrez où s'effectue le contrôle du niveau du liquide de frein. |
| 72 | Vase d'expansion (liquide de refroidissement) | moteur | Montrez où s'effectue le remplissage du liquide de refroidissement. |
| 80 | Jauge à huile | moteur | Montrez où doit s'effectuer le contrôle du niveau d'huile moteur. |
| 84 | Repère du témoin d'usure | pneu | Sur le flanc d’un pneumatique, désignez le repère du témoin d'usure de la bande de roulement. |
| 88 | Sécurité enfant | portiere-arriere | Indiquez où se situe la sécurité enfant sur l'une des portières à l’arrière du véhicule. |
| 96 | Accès aux ampoules avant | moteur | Montrez où s'effectue le changement d'une ampoule à l'avant du véhicule. |
| 98 | Accès aux ampoules arrière | coffre | Montrez où s'effectue le changement d'une ampoule à l'arrière du véhicule. |
| 100 | Gicleurs de lave-glace avant | capot | Montrez où se situent les gicleurs de lave-glace avant ? |

**À arbitrer** (exclues par défaut) — dis-moi si tu veux les ajouter :

| Fiche | Élément | Pourquoi j’hésite |
|---|---|---|
| 38 | Plaque de pression des pneus | « donnez la pression » : il faut d'abord trouver la plaque |
| 86 | Plaque de pression des pneus | « donnez la pression » : il faut d'abord trouver la plaque |
| 48 | Commande d'ouverture du capot | action « ouvrez et refermez », l'élément lui-même est évident |
| 64 | Commande d'ouverture du capot | action « procédez à l'ouverture », l'élément lui-même est évident |
| 60 | Ouverture du coffre | action « ouvrez et refermez », l'élément lui-même est évident |
| 62 | Ouverture du coffre | action « ouvrez et refermez », l'élément lui-même est évident |

## Clio 5 (manuelle)

| État | Fiches |
|---|---|
| ✅ Couvertes (zone validée, photo publiée) | — |
| ✏️ Zone en brouillon, à valider dans l’éditeur | 2, 8, 12, 22, 24, 36, 50, 56, 70, 72, 80, 96 |
| 🖼️ Zone validée mais photo pas encore publiée | — |
| 📷 Pas encore de photo ni de zone | 32, 34, 42, 58, 66, 84, 88, 98, 100 |

**Photos à prendre** (une vue d’ensemble où l’élève cherche, + un gros plan par élément si possible) :

- **Flanc d'un pneu, repère du témoin d'usure (TWI) bien visible** — pour : Repère du témoin d'usure (fiches 32, 84)
- **Côté de la voiture où se trouve la trappe à carburant** — pour : Trappe à carburant (fiches 34)
- **Chant d'une portière arrière ouverte, sécurité enfant visible** — pour : Sécurité enfant (fiches 42, 88)
- **Coffre ouvert, arrière des feux (accès aux ampoules arrière)** — pour : Accès aux ampoules arrière (fiches 58, 98)
- **Avant de la voiture capot fermé, gicleurs de lave-glace visibles** — pour : Gicleurs de lave-glace avant (fiches 66, 100)

## Yaris (automatique)

| État | Fiches |
|---|---|
| ✅ Couvertes (zone validée, photo publiée) | — |
| ✏️ Zone en brouillon, à valider dans l’éditeur | — |
| 🖼️ Zone validée mais photo pas encore publiée | — |
| 📷 Pas encore de photo ni de zone | 2, 8, 12, 22, 24, 32, 34, 36, 42, 50, 56, 58, 66, 70, 72, 80, 84, 88, 96, 98, 100 |

**Photos à prendre** (une vue d’ensemble où l’élève cherche, + un gros plan par élément si possible) :

- **Compartiment moteur, capot ouvert, pris de face (vue d'ensemble)** — pour : Bocal de lave-glace (remplissage), Bocal de liquide de frein, Vase d'expansion (liquide de refroidissement), Jauge à huile, Batterie, Bouchon de remplissage d'huile, Orifice de remplissage du lave-glace, Accès aux ampoules avant (fiches 2, 8, 12, 22, 24, 36, 50, 56, 70, 72, 80, 96)
- **Flanc d'un pneu, repère du témoin d'usure (TWI) bien visible** — pour : Repère du témoin d'usure (fiches 32, 84)
- **Côté de la voiture où se trouve la trappe à carburant** — pour : Trappe à carburant (fiches 34)
- **Chant d'une portière arrière ouverte, sécurité enfant visible** — pour : Sécurité enfant (fiches 42, 88)
- **Coffre ouvert, arrière des feux (accès aux ampoules arrière)** — pour : Accès aux ampoules arrière (fiches 58, 98)
- **Avant de la voiture capot fermé, gicleurs de lave-glace visibles** — pour : Gicleurs de lave-glace avant (fiches 66, 100)

## Conseils de prise de vue

- Lumière du jour, sans contre-jour ; voiture propre, compartiment moteur sans chiffon ni outil.
- Vue d’ensemble : cadrer large, comme l’élève voit le moteur quand il est devant la voiture.
- Gros plan : l’élément seul, net, avec un peu de contexte autour pour le reconnaître.
- Format paysage de préférence ; HEIC ou JPEG, peu importe (les métadonnées, dont la position GPS, sont supprimées à la publication).
