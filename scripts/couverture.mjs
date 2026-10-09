#!/usr/bin/env node
// Régénère COUVERTURE_PHOTOS.md à partir des données : `npm run couverture`.
import { readFile, writeFile, readdir } from 'node:fs/promises';

const lire = async (f) => JSON.parse(await readFile(f, 'utf8'));
const loc = await lire('src/data/localisables.json');
const manifeste = await lire('src/data/photos-manifest.json');
const fiches = (await lire('src/data/fiches.json')).fiches;
const voitures = [];
for (const f of (await readdir('src/data/vehicules')).sort()) voitures.push(await lire(`src/data/vehicules/${f}`));

const base = (f) => f.replace(/\.[a-z0-9]+$/i, '');
const q = (n) => fiches[n - 1].verification.question;
const lignes = [];
const ecrire = (...l) => lignes.push(...l);

ecrire(
  '# Couverture photos — mode « Trouve l’élément »',
  '',
  '> Fichier généré par `npm run couverture` : ne pas modifier à la main.',
  '',
  'Une fiche passe en mode « Trouve l’élément » pour une voiture quand **trois conditions** sont réunies : la fiche est dans la liste des fiches localisables, la photo est publiée (`npm run images`), et la zone est au statut `valide`. Sinon, elle reste en mode classique (réponse + auto-évaluation), sans rien casser.',
  '',
  '## 1. Fiches localisables (liste à valider)',
  '',
  'Vérifications extérieures qui demandent de **montrer, indiquer, désigner ou ouvrir** un élément. Fichier : `src/data/localisables.json` (le texte des fiches n’est pas touché).',
  '',
  '| Fiche | Élément à trouver | Photo nécessaire | Question |',
  '|---|---|---|---|',
  ...loc.fiches.map((l) => `| ${l.numero} | ${l.element} | ${l.vue} | ${q(l.numero)} |`),
  '',
  '**À arbitrer** (exclues par défaut) — dis-moi si tu veux les ajouter :',
  '',
  '| Fiche | Élément | Pourquoi j’hésite |',
  '|---|---|---|',
  ...loc.aArbitrer.map((l) => `| ${l.numero} | ${l.element} | ${l.raison} |`),
  '',
);

for (const v of voitures) {
  const id = v.vehicule.id;
  const publiee = (fichier) => !!manifeste[id]?.[base(fichier)];
  const etat = (n) => {
    const zones = v.zones.filter((z) => z.fiches.includes(n));
    if (zones.some((z) => z.statut === 'valide' && publiee(z.photo))) return 'couverte';
    if (zones.some((z) => z.statut === 'valide')) return 'valide-sans-photo';
    if (zones.length) return 'brouillon';
    return 'a-faire';
  };
  const parEtat = (e) => loc.fiches.filter((l) => etat(l.numero) === e).map((l) => l.numero);
  const liste = (ns) => (ns.length ? ns.join(', ') : '—');

  ecrire(`## ${v.vehicule.nom} (${v.vehicule.boite})`, '');
  ecrire(
    `| État | Fiches |`,
    `|---|---|`,
    `| ✅ Couvertes (zone validée, photo publiée) | ${liste(parEtat('couverte'))} |`,
    `| ✏️ Zone en brouillon, à valider dans l’éditeur | ${liste(parEtat('brouillon'))} |`,
    `| 🖼️ Zone validée mais photo pas encore publiée | ${liste(parEtat('valide-sans-photo'))} |`,
    `| 📷 Pas encore de photo ni de zone | ${liste(parEtat('a-faire'))} |`,
    '',
  );

  const declarees = v.photos.filter((p) => !publiee(p.fichier));
  if (declarees.length) {
    ecrire('**Photos déclarées mais pas encore publiées** (à déposer dans `photos-source/' + id + '/` puis `npm run images`) :', '');
    for (const p of declarees) ecrire(`- \`${p.fichier}\` — ${p.alt}`);
    ecrire('');
  }

  // Vues encore sans aucune zone : photos à prendre.
  const vuesAFaire = [...new Set(loc.fiches.filter((l) => etat(l.numero) === 'a-faire').map((l) => l.vue))];
  const vuesDeclarees = new Set(
    v.photos.length && v.photos.some((p) => /moteur/.test(p.fichier) && p.role === 'vue-ensemble') ? ['moteur'] : [],
  );
  const aPrendre = vuesAFaire.filter((vue) => !vuesDeclarees.has(vue));
  if (aPrendre.length) {
    ecrire('**Photos à prendre** (une vue d’ensemble où l’élève cherche, + un gros plan par élément si possible) :', '');
    for (const vue of aPrendre) {
      const concernees = loc.fiches.filter((l) => l.vue === vue && etat(l.numero) === 'a-faire');
      const elements = [...new Set(concernees.map((l) => l.element))].join(', ');
      ecrire(`- **${loc.vues[vue]}** — pour : ${elements} (fiches ${concernees.map((l) => l.numero).join(', ')})`);
    }
    ecrire('');
  }
}

ecrire(
  '## Conseils de prise de vue',
  '',
  '- Lumière du jour, sans contre-jour ; voiture propre, compartiment moteur sans chiffon ni outil.',
  '- Vue d’ensemble : cadrer large, comme l’élève voit le moteur quand il est devant la voiture.',
  '- Gros plan : l’élément seul, net, avec un peu de contexte autour pour le reconnaître.',
  '- Format paysage de préférence ; HEIC ou JPEG, peu importe (les métadonnées, dont la position GPS, sont supprimées à la publication).',
  '',
);

await writeFile('COUVERTURE_PHOTOS.md', lignes.join('\n'));
console.log('✓ COUVERTURE_PHOTOS.md régénéré');
