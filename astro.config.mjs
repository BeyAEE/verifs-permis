import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import serviceWorker from './scripts/integrations/service-worker.mjs';
import fixturesPhotos from './scripts/integrations/fixtures-photos.mjs';

// Build « fixtures » (tests de bout en bout) : mêmes pages, mais voitures et
// photos de test à la place des vraies données. Jamais déployé.
const FIXTURES = process.env.VERIFS_FIXTURES === '1';
const racine = (p) => fileURLToPath(new URL(p, import.meta.url));

export const SITE = 'https://beyaee.github.io';
export const BASE = '/verifs-permis';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/editeur/') && !page.includes('/404'),
    }),
    ...(FIXTURES ? [fixturesPhotos()] : []),
    serviceWorker(),
  ],
  vite: {
    resolve: {
      alias: {
        '@vehicules': racine(FIXTURES ? './tests/fixtures/vehicules' : './src/data/vehicules'),
        '@manifeste-photos': racine(
          FIXTURES ? './tests/fixtures/photos-manifest.json' : './src/data/photos-manifest.json',
        ),
      },
    },
  },
});
