// Génère dist/sw.js après le build : liste de pré-cache (tout le site sauf les
// photos et l'éditeur) + version calculée sur le contenu, pour qu'un nouveau
// déploiement remplace proprement l'ancien cache.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const EXCLUS = [/^photos\//, /^editeur\//, /^sw\.js$/, /^og\.png$/, /\.map$/, /^sitemap.*\.xml$/, /^robots\.txt$/];

async function lister(dossier) {
  const sortie = [];
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) sortie.push(...(await lister(chemin)));
    else sortie.push(chemin);
  }
  return sortie;
}

export default function serviceWorker() {
  let base = '/';
  return {
    name: 'verifs-service-worker',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : config.base + '/';
      },
      'astro:build:done': async ({ dir }) => {
        const racine = fileURLToPath(dir);
        const fichiers = (await lister(racine))
          .map((f) => relative(racine, f).split(sep).join('/'))
          .filter((f) => !EXCLUS.some((re) => re.test(f)))
          .sort();

        const hash = createHash('sha256');
        for (const f of fichiers) hash.update(f).update(await readFile(join(racine, f)));
        const version = hash.digest('hex').slice(0, 12);

        // Les pages sont servies par leur dossier : « fiche/26/index.html » → « fiche/26/ ».
        const urls = fichiers.map((f) => base + f.replace(/(^|\/)index\.html$/, '$1'));
        const gabarit = await readFile(new URL('../sw-template.js', import.meta.url), 'utf8');
        const sw = gabarit
          .replace('__VERSION__', version)
          .replace('__BASE__', base)
          .replace('__PRECACHE__', JSON.stringify(urls));
        await writeFile(join(racine, 'sw.js'), sw, 'utf8');
        console.log(`[sw] ${urls.length} fichiers pré-cachés, version ${version}`);
      },
    },
  };
}
