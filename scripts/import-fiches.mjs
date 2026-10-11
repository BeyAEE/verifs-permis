#!/usr/bin/env node
// Import reproductible des 100 fiches depuis l'outil moniteur (dépôt en lecture seule).
//
//   npm run import:fiches                       → commit épinglé ci-dessous
//   npm run import:fiches -- --commit <sha>     → autre commit de beyaee/outil-moniteur
//   npm run import:fiches -- --fichier <chemin> → copie locale de remc-moniteur.html
//
// Produit :
//   data/source/fiches-outil-moniteur.js  le bloc FICHES copié caractère pour caractère
//   data/source/SOURCE.json               provenance (dépôt, commit, fichier, sha256)
//   src/data/fiches.json                  données propres utilisées par le site
// Aucun texte n'est réécrit : le script échoue plutôt que de « corriger ».
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extraireBloc, lireBloc, versSchema, sha256 } from './lib/fiches-source.mjs';

const DEPOT = 'BeyAEE/outil-moniteur';
const FICHIER = 'remc-moniteur.html';
const COMMIT_EPINGLE = '61325032f04b30d4d8dfdec905544e73cd91999a';

const args = process.argv.slice(2);
const opt = (nom) => {
  const i = args.indexOf(nom);
  return i === -1 ? undefined : args[i + 1];
};

const commit = opt('--commit') ?? COMMIT_EPINGLE;
const fichierLocal = opt('--fichier');

let html;
if (fichierLocal) {
  html = await readFile(fichierLocal, 'utf8');
  console.log(`Source : fichier local ${fichierLocal}`);
} else {
  const url = `https://raw.githubusercontent.com/${DEPOT}/${commit}/${FICHIER}`;
  const rep = await fetch(url);
  if (!rep.ok) throw new Error(`Téléchargement impossible (${rep.status}) : ${url}`);
  html = await rep.text();
  console.log(`Source : ${url}`);
}

const bloc = extraireBloc(html);
const brutes = lireBloc(bloc);
const fiches = versSchema(brutes);

if (fiches.length !== 100) throw new Error(`Attendu 100 fiches, trouvé ${fiches.length}`);

const empreinte = sha256(bloc);
const provenance = {
  depot: DEPOT,
  commit: fichierLocal ? null : commit,
  fichier: fichierLocal ? fichierLocal : FICHIER,
  bloc: 'const FICHES=[ … ];',
  sha256: empreinte,
};

await mkdir('data/source', { recursive: true });
await mkdir('src/data', { recursive: true });
await writeFile('data/source/fiches-outil-moniteur.js', bloc + '\n', 'utf8');
await writeFile('data/source/SOURCE.json', JSON.stringify(provenance, null, 2) + '\n', 'utf8');
await writeFile(
  'src/data/fiches.json',
  JSON.stringify({ schema: 'verifs-permis/fiches@1', source: provenance, fiches }, null, 2) + '\n',
  'utf8',
);

console.log(`✓ ${fiches.length} fiches importées (sha256 du bloc ${empreinte.slice(0, 12)}…)`);
