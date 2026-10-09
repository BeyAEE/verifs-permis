# Vérifs permis B — ECF Albi

Site de révision des **questions de vérification du permis B** pour les élèves
de l'auto-école ECF Picco/Pechberty à Albi. Sans compte, sans traceur, et
utilisable hors connexion après la première visite.

**En ligne :** https://beyaee.github.io/verifs-permis/

## Stack

**Astro 5 en sortie statique + TypeScript sans framework côté client.** Astro
pré-génère les 100 pages de fiches (partage, référencement, hors ligne) et
n'envoie aucun JavaScript par défaut. Les quelques interactions (entraînement,
examen blanc, visionneuse) sont de petits scripts vanilla : la page d'accueil
pèse moins de 70 Ko hors police (une trentaine de Ko compressés), pour un
plafond fixé à 200 Ko.

Le reste : Vitest (tests unitaires), Playwright (bout en bout), sharp
(images), service worker écrit à la main (pas de dépendance PWA).

## Lancer en local

```bash
npm install
npm run dev            # http://localhost:4321/verifs-permis/
```

Le service worker n'est actif qu'en production. Pour tester le vrai site :

```bash
npm run build && npm run preview
```

## Tests

```bash
npm test                              # 100+ tests unitaires, dont l'intégrité des fiches
npx playwright install chromium webkit   # une seule fois
npm run test:e2e                      # parcours sur iPhone SE, Pixel 7 et ordinateur
```

Les tests de bout en bout tournent sur un build spécial (`npm run build:test`)
qui remplace les vraies voitures par `tests/fixtures/` : une photo de test et
des zones de test validées. Ce build n'est jamais déployé.

## Mettre à jour une fiche

Les fiches viennent de l'outil moniteur (`beyaee/outil-moniteur`), qui reste la
source. **On ne modifie jamais `src/data/fiches.json` à la main.**

1. Corrige la fiche dans l'outil moniteur (`remc-moniteur.html`), committe et pousse.
2. Ici : `npm run import:fiches -- --commit <sha du commit>`.
3. `npm test` : le test d'intégrité vérifie 100 fiches, sans trou, texte identique à la source.
4. Mets à jour le commit épinglé dans `scripts/import-fiches.mjs` et retire le point de `DATA_REVIEW.md`.
5. Committe et pousse : le site se met à jour tout seul.

Format des données (`src/data/fiches.json`, schéma `verifs-permis/fiches@1`) :
un objet par fiche, avec `numero`, `type` (`interieure` / `exterieure`), puis
`verification`, `securite` et `secours`, chacun avec `question` et `reponse`.
Ce fichier peut servir de source commune aux deux sites.

## Ajouter des photos et placer les zones

### Publier des photos

1. Dépose les photos dans `photos-source/<voiture>/` (`clio5` ou `yaris`), en JPEG ou HEIC.
2. Déclare chaque photo dans `src/data/vehicules/<voiture>.json` (`fichier`, `alt`, `role` : `vue-ensemble` ou `gros-plan`).
3. `npm run images` : le script crée les versions WebP/AVIF (800, 1400 et 2400 px) et **supprime toutes les métadonnées**, position GPS comprise. Il vérifie ensuite qu'il n'en reste aucune.
4. `npm run couverture` met à jour `COUVERTURE_PHOTOS.md`.

`photos-source/` n'est **jamais** committé, puisque les originaux contiennent la position GPS. Seul `public/photos/` (nettoyé) part en ligne.

HEIC : sur Mac, `sips` le convertit automatiquement. Ailleurs, convertis
d'abord en JPEG (`heif-convert photo.heic photo.jpg`) et vérifie le résultat :
certaines versions d'ImageMagick échouent sur les HEIC récents d'iPhone.

### Placer une zone avec l'éditeur (5 étapes)

1. Ouvre **https://beyaee.github.io/verifs-permis/editeur/** (ou `/editeur/` en local), puis choisis la voiture, la photo et la fiche.
2. Touche la photo pour poser les points du contour. Fais-les glisser pour ajuster, et pince pour zoomer.
3. Donne un libellé et un gros plan, garde le statut **brouillon**, puis **Enregistrer la zone**.
4. Passe en **Tester comme un élève** pour vérifier. Si tout est bon, repasse la zone en **valide** et enregistre.
5. **Exporter**, remplace `src/data/vehicules/<voiture>.json` par le fichier téléchargé, puis committe.

Pour une photo pas encore publiée, l'éditeur permet aussi d'ouvrir l'image
depuis ton téléphone et de dessiner dessus. Ton travail est sauvegardé dans le
navigateur tant que tu n'as pas exporté.

Seules les zones **valides** dont la photo est publiée sont envoyées au
navigateur des élèves. Une zone en brouillon n'apparaît jamais en ligne.

## Déployer

Tout `git push` sur `main` lance GitHub Actions
(`.github/workflows/deploiement.yml`) dans cet ordre :

1. les tests unitaires (intégrité des données comprise) ;
2. la vérification des types ;
3. Playwright ;
4. le build ;
5. la mise en ligne sur GitHub Pages.

Si un test échoue, rien n'est mis en ligne.

Une fois pour toutes (déjà fait) : Settings → Pages → Source : **GitHub Actions**.

## Choix faits en cours de route

- **Vert de la charte.** `#14A856` sur blanc fait 3,1:1, sous le seuil AA de 4,5 pour du texte. Il sert donc aux éléments graphiques (zones, icônes). Les boutons « Je savais » et les textes verts utilisent `#0C7A3B` (5,4:1). Les contrastes sont vérifiés par un test en mode clair et en mode sombre.
- **Réponses absentes.** 55 fiches n'ont pas de réponse écrite pour la vérification dans la source. Le site affiche « Pas de réponse écrite… il faut la faire ou la montrer », sans rien inventer. Le test d'intégrité vérifie la liste exacte de ces fiches au lieu d'exiger « tous les champs remplis ».
- **Fiches jumelles.** Une zone peut servir à plusieurs fiches (`"fiches": [8, 70]`), puisque 31 vérifications existent en double.
- **Score en entraînement.** Pour « Trouve l'élément », c'est le premier essai qui compte. « Réessayer » sert à apprendre, pas à remonter le score.
- **Alternative clavier.** Elle propose les zones nommées de la même photo. S'il y en a moins de deux, un lien « Je ne peux pas utiliser la photo » repasse la question en mode classique.
- **Séries « intérieures » et « extérieures ».** Elles suivent l'ordre des fiches. La série « 10 au hasard » est tirée sans doublon.
- **Examen en cours.** Il reprend s'il est rechargé (mémoire de session) et peut être abandonné.
- **Hors ligne.** Le site entier est pré-caché (~1 Mo). Pour les photos, seules celles de la voiture choisie sont gardées, avec une largeur par photo. Le service worker sert la largeur disponible la plus proche.
- **Choix de la voiture.** Il est demandé au premier lancement sur les pages élèves. Il n'est pas demandé sur les mentions légales, la page 404 ni l'éditeur.
- **Astro 5** plutôt que la toute dernière version majeure : API stable et bien connue.
