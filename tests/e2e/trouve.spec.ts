import { test, expect, choisirVoiture, toucherPhoto, examenSurFiche } from './outils';

// Zones de test (tests/fixtures/vehicules/clio5.json) :
// liquide de frein = rectangle 12–30 % × 18–38 % de la photo de test.
test.describe('Trouve l’élément', () => {
  test('Clio, fiche 8 : bonne zone puis toucher à côté → correction affichée', async ({ page }) => {
    await page.goto('./');
    await choisirVoiture(page, 'Clio 5');

    // 1re tentative : dans la bonne zone.
    await examenSurFiche(page, '08');
    const scene = page.locator('.vis-scene');
    await expect(scene).toBeVisible();
    await toucherPhoto(page, scene, 21, 28);
    await page.getByRole('button', { name: 'Valider', exact: true }).click();
    await expect(page.getByText('Bravo, c’est bien là !').first()).toBeVisible();
    await expect(page.locator('.vis-marqueur[data-etat="bon"]')).toBeVisible();
    await expect(page.getByText('Réponse officielle')).toBeVisible();
    await expect(page.getByRole('img', { name: /gros plan du bocal de liquide de frein/i })).toBeVisible();

    // 2e examen : on touche à côté.
    await examenSurFiche(page, '08');
    await toucherPhoto(page, page.locator('.vis-scene'), 50, 88);
    await page.getByRole('button', { name: 'Valider', exact: true }).click();
    await expect(page.getByText('Pas tout à fait. La bonne zone est en surbrillance verte.').first()).toBeVisible();
    await expect(page.locator('.vis-marqueur[data-etat="faux"]')).toBeVisible();
    await expect(page.locator('.vis-zones .zone-revelee')).toHaveCount(1);
    await expect(page.getByText('Réponse officielle')).toBeVisible();
    // Examen blanc : une seule tentative.
    await expect(page.getByRole('button', { name: 'Réessayer' })).toHaveCount(0);
    await page.getByRole('button', { name: /Question suivante/ }).click();
    await expect(page.getByText('Fiche 8 · question 2 sur 3')).toBeVisible();
  });

  test('vérification intérieure (fiche 31, feux de détresse) : on cherche aussi la commande sur la photo', async ({ page }) => {
    await page.goto('./');
    await choisirVoiture(page, 'Clio 5');
    await examenSurFiche(page, '31');
    const scene = page.locator('.vis-scene');
    await expect(scene).toBeVisible();
    await toucherPhoto(page, scene, 20, 70);
    await page.getByRole('button', { name: 'Valider', exact: true }).click();
    await expect(page.getByText('Bravo, c’est bien là !').first()).toBeVisible();
    // Le repère de la voiture (le geste à faire) suit la réponse officielle.
    await expect(page.getByText('Repère de test : bouton au triangle rouge.')).toBeVisible();

    // Page de la fiche : la photo montre aussi la zone, avec le repère.
    await page.goto('fiche/31/');
    await page.getByRole('button', { name: 'Voir la réponse' }).first().click();
    await expect(page.locator('[data-zone-photo] .vis-zones .zone-bonne')).toHaveCount(1);
    await expect(page.getByText('Repère de test : bouton au triangle rouge.')).toBeVisible();
  });

  test('alternative au clavier : choix dans la liste des zones de la photo', async ({ page }) => {
    await page.goto('./');
    await choisirVoiture(page, 'Clio 5');
    await examenSurFiche(page, '08');
    await page.getByText('Choisir dans une liste plutôt').click();
    await page.getByRole('radio', { name: 'Bocal de liquide de frein' }).check();
    await page.getByRole('button', { name: 'Valider ce choix' }).click();
    await expect(page.getByText('Bravo, c’est bien là !').first()).toBeVisible();
    // La zone en brouillon n'est jamais proposée.
    await expect(page.getByRole('radio', { name: 'Vase d’expansion' })).toHaveCount(0);
  });

  test('zoom : le point touché reste juste', async ({ page }) => {
    await page.goto('./');
    await choisirVoiture(page, 'Clio 5');
    await examenSurFiche(page, '08');
    await page.getByRole('button', { name: 'Zoomer', exact: true }).click();
    await page.getByRole('button', { name: 'Zoomer', exact: true }).click();
    // Après zoom au centre, on vise le centre du bocal via ses coordonnées écran recalculées.
    const cible = await page.evaluate(() => {
      const scene = document.querySelector('.vis-scene')!.getBoundingClientRect();
      const calque = document.querySelector('.vis-calque')!.getBoundingClientRect();
      return { x: calque.left + calque.width * 0.21 - scene.left, y: calque.top + calque.height * 0.28 - scene.top, w: scene.width, h: scene.height };
    });
    // Si le bocal est sorti du cadre après zoom, on recadre sur la photo entière.
    if (cible.x < 0 || cible.y < 0 || cible.x > cible.w || cible.y > cible.h) {
      await page.getByRole('button', { name: 'Revenir à la photo entière' }).click();
      await page.locator('.vis-scene').click({ position: { x: cible.w * 0.21, y: cible.h * 0.28 } });
    } else {
      await page.locator('.vis-scene').click({ position: { x: cible.x, y: cible.y } });
    }
    await page.getByRole('button', { name: 'Valider', exact: true }).click();
    await expect(page.getByText('Bravo, c’est bien là !').first()).toBeVisible();
  });

  test('repli en mode classique : Yaris sans photo, « Je ne sais pas encore »', async ({ page }) => {
    await page.goto('./');
    await choisirVoiture(page, 'Yaris');
    await examenSurFiche(page, '08');
    await expect(page.locator('.vis-scene')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Voir la réponse' })).toBeVisible();

    await page.locator('header').getByRole('button', { name: /changer de voiture/ }).click();
    await choisirVoiture(page, 'Je ne sais pas encore');
    await examenSurFiche(page, '08');
    await expect(page.locator('.vis-scene')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Voir la réponse' })).toBeVisible();
  });

  test('page de la fiche 8 : la réponse montre la zone sur la photo de la Clio', async ({ page }) => {
    await page.goto('fiche/8/');
    await choisirVoiture(page, 'Clio 5');
    await page.getByRole('button', { name: 'Voir la réponse' }).first().click();
    await expect(page.getByText('Sur ta Clio 5')).toBeVisible();
    await expect(page.locator('[data-zone-photo] .vis-zones .zone-bonne')).toHaveCount(1);
    await expect(page.locator('[data-reponse="verification"] .rappel')).toBeHidden();
  });
});
