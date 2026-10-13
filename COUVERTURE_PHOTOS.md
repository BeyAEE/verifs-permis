# Couverture photos — mode « Trouve l’élément »

> Fichier généré par `npm run couverture` : ne pas modifier à la main.

Une fiche passe en mode « Trouve l’élément » pour une voiture quand **trois conditions** sont réunies : la fiche est dans la liste des fiches localisables, la photo est publiée (`npm run images`), et la zone est au statut `valide`. Sinon, elle reste en mode classique (réponse + auto-évaluation), sans rien casser.

## 1. Fiches localisables (liste à valider)

Vérifications, intérieures ou extérieures, qui demandent de **montrer, indiquer, désigner, ouvrir ou actionner** un élément. Fichier : `src/data/localisables.json` (le texte des fiches n’est pas touché).

| Fiche | Élément à trouver | Photo nécessaire | Question |
|---|---|---|---|
| 1 | Commande de réglage de la hauteur des feux | planche-gauche | Montrez la commande De réglage de hauteur des feux. |
| 2 | Bocal de lave-glace (remplissage) | moteur | Montrez où s'effectue le remplissage du produit lave-glace. |
| 3 | Commande « nuit » du rétroviseur intérieur | retroviseur | Mettez le rétroviseur intérieur en position "nuit". |
| 5 | Manette des essuie-glaces | poste-conduite | Faites fonctionner les essuie-glaces avants du véhicule sur la position la plus rapide. |
| 8 | Bocal de liquide de frein | moteur | Montrez où s'effectue le contrôle du niveau du liquide de frein. |
| 11 | Indicateur de niveau de carburant | combine | Montrez l'indicateur de niveau de carburant. |
| 12 | Vase d'expansion (liquide de refroidissement) | moteur | Montrez où s'effectue le remplissage du liquide de refroidissement. |
| 13 | Commande de dégivrage de la lunette arrière | console | Actionnez le dégivrage de la lunette arrière et montrez le voyant ou le repère correspondant. |
| 19 | Commande de réglage du volant | colonne | Montrez la commande de réglage du volant. |
| 21 | Commande de répartition de l'air (vers le pare-brise) | console | Positionnez la commande pour diriger l'air vers le pare-brise. |
| 22 | Jauge à huile | moteur | Montrez où doit s'effectuer le contrôle du niveau d'huile moteur. |
| 24 | Batterie | moteur | Montrez l'emplacement de la batterie du véhicule. |
| 31 | Commande des feux de détresse | console | Actionnez les feux de détresse. |
| 32 | Repère du témoin d'usure | pneu | Sur le flanc d’un pneumatique, désignez le repère du témoin d'usure de la bande de roulement. |
| 33 | Commande du régulateur de vitesse | poste-conduite | Montrez la commande permettant d’actionner le régulateur de vitesse. |
| 34 | Trappe à carburant | flanc | Ouvrez la trappe à carburant et/ou vérifiez la bonne fermeture du bouchon. |
| 35 | Avertisseur sonore | poste-conduite | Sans l'actionner, montrez la commande de l'avertisseur sonore. |
| 36 | Bouchon de remplissage d'huile | moteur | Montrez où s'effectue le remplissage de l'huile moteur. |
| 37 | Commande de désactivation de l'airbag passager | porte-passager | Montrez la commande permettant de désactiver l'airbag du passager avant. |
| 42 | Sécurité enfant | portiere-arriere | Indiquez où se situe la sécurité enfant sur l'une des portières à l’arrière du véhicule. |
| 43 | Commande du feu de brouillard arrière | poste-conduite | Allumez le(s) feu(x) de brouillard arrière(s) et montrez le voyant correspondant. |
| 45 | Réglage de la hauteur de l'appui-tête | siege | Montrez comment régler la hauteur de l'appui-tête du siège conducteur. |
| 49 | Commande de recyclage de l'air | console | Montrez la commande de recyclage de l'air. |
| 50 | Orifice de remplissage du lave-glace | moteur | Montrez l'orifice de remplissage du produit lave-glace. |
| 51 | Commande des feux de route | poste-conduite | Allumez les feux de route et montrez le voyant correspondant. |
| 56 | Accès aux ampoules avant | moteur | Montrez où s'effectue le changement d'une ampoule à l'avant du véhicule. |
| 57 | Commande du limiteur de vitesse | poste-conduite | Si le véhicule en est équipé, montrez la commande du limiteur de vitesse. |
| 58 | Accès aux ampoules arrière | coffre | Montrez où s'effectue le changement d'une ampoule à l'arrière du véhicule. |
| 59 | Manette de l'essuie-glace arrière | poste-conduite | Faites fonctionner l’essuie-glace arrière du véhicule. |
| 61 | Attaches Isofix | banquette | Indiquez où se situe les attaches de type Isofix dans le véhicule. |
| 65 | Commande de réglage de la hauteur des feux | planche-gauche | Montrez la commande de réglage de hauteur des feux. |
| 66 | Gicleurs de lave-glace avant | capot | Montrez où se situent les gicleurs de lave-glace avant. |
| 67 | Commande « nuit » du rétroviseur intérieur | retroviseur | Mettez le rétroviseur intérieur en position "nuit". Si le rétroviseur de l'accompagnateur gène la manipulation du dispositif, l'explication suffit. |
| 69 | Manette des essuie-glaces | poste-conduite | Faites fonctionner les essuie-glaces avants du véhicule sur la position la plus rapide. |
| 70 | Bocal de liquide de frein | moteur | Montrez où s'effectue le contrôle du niveau du liquide de frein. |
| 72 | Vase d'expansion (liquide de refroidissement) | moteur | Montrez où s'effectue le remplissage du liquide de refroidissement. |
| 73 | Commande de dégivrage de la lunette arrière | console | Actionnez le dégivrage de la lunette arrière et montrez le voyant ou le repère correspondant. |
| 79 | Commande de répartition de l'air (vers le pare-brise) | console | Positionnez la commande pour diriger l'air vers le pare-brise. |
| 80 | Jauge à huile | moteur | Montrez où doit s'effectuer le contrôle du niveau d'huile moteur. |
| 84 | Repère du témoin d'usure | pneu | Sur le flanc d’un pneumatique, désignez le repère du témoin d'usure de la bande de roulement. |
| 85 | Commande des feux de détresse | console | Actionnez les feux de détresse. |
| 87 | Commande de désactivation de l'airbag passager | porte-passager | Montrez la commande permettant de désactiver l'airbag du passager avant. |
| 88 | Sécurité enfant | portiere-arriere | Indiquez où se situe la sécurité enfant sur l'une des portières à l’arrière du véhicule. |
| 91 | Commande du feu de brouillard arrière | poste-conduite | Allumez le(s) feu(x) de brouillard arrière(s) et montrez le voyant correspondant. |
| 93 | Commande de recyclage de l'air | console | Montrez la commande de recyclage de l'air. |
| 95 | Commande des feux de route | poste-conduite | Allumez les feux de route et montrez le voyant correspondant. |
| 96 | Accès aux ampoules avant | moteur | Montrez où s'effectue le changement d'une ampoule à l'avant du véhicule. |
| 97 | Manette de l'essuie-glace arrière | poste-conduite | Faites fonctionner l’essuie-glace arrière du véhicule. |
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
| ✅ Couvertes (zone validée, photo publiée) | 1, 2, 5, 8, 12, 13, 19, 21, 22, 24, 31, 33, 35, 36, 43, 49, 50, 51, 56, 57, 59, 65, 69, 70, 72, 73, 79, 80, 85, 91, 93, 95, 96, 97 |
| ✏️ Zone en brouillon, à valider dans l’éditeur | — |
| 🖼️ Zone validée mais photo pas encore publiée | — |
| 📷 Pas encore de photo ni de zone | 3, 11, 32, 34, 37, 42, 45, 58, 61, 66, 67, 84, 87, 88, 98, 100 |

**Photos à prendre** (une vue d’ensemble où l’élève cherche, + un gros plan par élément si possible) :

- **Rétroviseur intérieur, manette « nuit » visible** — pour : Commande « nuit » du rétroviseur intérieur (fiches 3, 67)
- **Combiné d'instruments allumé (jauge de carburant visible)** — pour : Indicateur de niveau de carburant (fiches 11)
- **Flanc d'un pneu, repère du témoin d'usure (TWI) bien visible** — pour : Repère du témoin d'usure (fiches 32, 84)
- **Côté de la voiture où se trouve la trappe à carburant** — pour : Trappe à carburant (fiches 34)
- **Porte passager ouverte : côté de la planche de bord (airbag passager)** — pour : Commande de désactivation de l'airbag passager (fiches 37, 87)
- **Chant d'une portière arrière ouverte, sécurité enfant visible** — pour : Sécurité enfant (fiches 42, 88)
- **Siège conducteur : appuie-tête et son bouton** — pour : Réglage de la hauteur de l'appui-tête (fiches 45)
- **Coffre ouvert, arrière des feux (accès aux ampoules arrière)** — pour : Accès aux ampoules arrière (fiches 58, 98)
- **Banquette arrière : attaches Isofix** — pour : Attaches Isofix (fiches 61)
- **Avant de la voiture capot fermé, gicleurs de lave-glace visibles** — pour : Gicleurs de lave-glace avant (fiches 66, 100)

## Yaris (automatique)

| État | Fiches |
|---|---|
| ✅ Couvertes (zone validée, photo publiée) | 2, 8, 12, 22, 36, 50, 56, 70, 72, 80, 96 |
| ✏️ Zone en brouillon, à valider dans l’éditeur | — |
| 🖼️ Zone validée mais photo pas encore publiée | — |
| 📷 Pas encore de photo ni de zone | 1, 3, 5, 11, 13, 19, 21, 24, 31, 32, 33, 34, 35, 37, 42, 43, 45, 49, 51, 57, 58, 59, 61, 65, 66, 67, 69, 73, 79, 84, 85, 87, 88, 91, 93, 95, 97, 98, 100 |

**Photos à prendre** (une vue d’ensemble où l’élève cherche, + un gros plan par élément si possible) :

- **Bas de la planche de bord, à gauche du volant (réglage de la hauteur des feux)** — pour : Commande de réglage de la hauteur des feux (fiches 1, 65)
- **Rétroviseur intérieur, manette « nuit » visible** — pour : Commande « nuit » du rétroviseur intérieur (fiches 3, 67)
- **Poste de conduite vu du siège conducteur : volant, manettes et combiné** — pour : Manette des essuie-glaces, Commande du régulateur de vitesse, Avertisseur sonore, Commande du feu de brouillard arrière, Commande des feux de route, Commande du limiteur de vitesse, Manette de l'essuie-glace arrière (fiches 5, 33, 35, 43, 51, 57, 59, 69, 91, 95, 97)
- **Combiné d'instruments allumé (jauge de carburant visible)** — pour : Indicateur de niveau de carburant (fiches 11)
- **Console centrale : feux de détresse et commandes de chauffage** — pour : Commande de dégivrage de la lunette arrière, Commande de répartition de l'air (vers le pare-brise), Commande des feux de détresse, Commande de recyclage de l'air (fiches 13, 21, 31, 49, 73, 79, 85, 93)
- **Sous le volant : levier de réglage du volant** — pour : Commande de réglage du volant (fiches 19)
- **Flanc d'un pneu, repère du témoin d'usure (TWI) bien visible** — pour : Repère du témoin d'usure (fiches 32, 84)
- **Côté de la voiture où se trouve la trappe à carburant** — pour : Trappe à carburant (fiches 34)
- **Porte passager ouverte : côté de la planche de bord (airbag passager)** — pour : Commande de désactivation de l'airbag passager (fiches 37, 87)
- **Chant d'une portière arrière ouverte, sécurité enfant visible** — pour : Sécurité enfant (fiches 42, 88)
- **Siège conducteur : appuie-tête et son bouton** — pour : Réglage de la hauteur de l'appui-tête (fiches 45)
- **Coffre ouvert, arrière des feux (accès aux ampoules arrière)** — pour : Accès aux ampoules arrière (fiches 58, 98)
- **Banquette arrière : attaches Isofix** — pour : Attaches Isofix (fiches 61)
- **Avant de la voiture capot fermé, gicleurs de lave-glace visibles** — pour : Gicleurs de lave-glace avant (fiches 66, 100)

## Conseils de prise de vue

- Lumière du jour, sans contre-jour ; voiture propre, compartiment moteur sans chiffon ni outil.
- Vue d’ensemble : cadrer large, comme l’élève voit le moteur quand il est devant la voiture.
- Gros plan : l’élément seul, net, avec un peu de contexte autour pour le reconnaître.
- Format paysage de préférence ; HEIC ou JPEG, peu importe (les métadonnées, dont la position GPS, sont supprimées à la publication).
