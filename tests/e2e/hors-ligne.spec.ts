import { test, expect, choisirVoiture } from './outils';

// Le contrôle du service worker et du mode hors ligne n'est fiable dans
// Playwright qu'avec Chromium : le test est ignoré sur WebKit (iPhone SE).
test('hors connexion : tout le site + les photos de la voiture choisie', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'service worker testé sous Chromium');
  await page.goto('./');
  await choisirVoiture(page, 'Clio 5');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // Photos de la Clio mises en cache au choix de la voiture.
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('photos-'))))
    .toEqual(['photos-clio5']);
  await expect.poll(() => page.evaluate(async () => (await (await caches.open('photos-clio5')).keys()).length)).toBeGreaterThan(0);

  await context.setOffline(true);

  for (const chemin of ['fiches/', 'fiche/42/', 'fiche/100/', 'entrainement/', 'mentions-legales/']) {
    await page.goto(chemin);
    await expect(page.locator('h1')).toBeVisible();
  }

  // L'examen fonctionne hors ligne, photo de la Clio comprise.
  await page.goto('examen/');
  await page.getByLabel('Tu es en voiture avec ton moniteur ?').fill('08');
  await page.getByRole('button', { name: 'C’est parti' }).click();
  const image = page.locator('.vis-calque img');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  // Une page inconnue hors ligne affiche la page 404 du site.
  await page.goto('page-qui-n-existe-pas/');
  await expect(page.getByRole('heading', { name: 'Mauvaise route !' })).toBeVisible();

  await context.setOffline(false);
});
