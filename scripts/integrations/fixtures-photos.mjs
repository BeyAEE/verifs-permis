// Build de test uniquement : copie les photos de test dans dist-test/photos/.
import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export default function fixturesPhotos() {
  return {
    name: 'verifs-fixtures-photos',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        await cp(fileURLToPath(new URL('../../tests/fixtures/photos/', import.meta.url)), fileURLToPath(new URL('photos/', dir)), {
          recursive: true,
        });
        console.log('[fixtures] photos de test copiées');
      },
    },
  };
}
