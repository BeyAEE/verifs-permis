import { test, expect, choisirVoiture, examenSurFiche } from './outils';

test.describe('changement de voiture', () => {
  test('demandée au premier lancement, mémorisée, modifiable depuis la pastille', async ({ page }) => {
    await page.goto('./');
    await choisirVoiture(page, 'Yaris');
    const pastille = page.locator('header').getByRole('button', { name: /Yaris, boîte automatique/ });
    await expect(pastille).toBeVisible();

    await page.reload();
    await expect(page.getByRole('dialog')).toBeHidden(); // plus de question au 2e lancement
    await expect(pastille).toBeVisible();

    await pastille.click();
    await choisirVoiture(page, 'Clio 5');
    await expect(page.locator('header').getByRole('button', { name: /Clio 5, boîte manuelle/ })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('verifs-permis:v1'))).toContain('clio5');
  });
});

test.describe('recherche', () => {
  test('insensible aux accents et à la casse, avec filtre et accès direct', async ({ page }) => {
    await page.goto('fiches/');
    await choisirVoiture(page, 'Je ne sais pas encore');
    await expect(page.getByRole('status')).toHaveText('100 fiches');

    const recherche = page.getByLabel('Rechercher dans les fiches');
    await recherche.fill('ETHYLOTEST');
    const nombre = await page.locator('li[data-fiche]:visible').count();
    expect(nombre).toBeGreaterThan(0);
    await expect(page.locator('li[data-fiche="17"]')).toBeVisible();
    await recherche.fill('éthylotest');
    await expect(page.locator('li[data-fiche]:visible')).toHaveCount(nombre);

    await recherche.fill('liquide frein');
    await expect(page.locator('li[data-fiche="8"]')).toBeVisible();
    await page.getByRole('radio', { name: 'Intérieures' }).check();
    await expect(page.locator('li[data-fiche="8"]')).toBeHidden();

    await recherche.fill('zzzz introuvable');
    await expect(page.getByText('Aucune fiche ne correspond')).toBeVisible();

    await page.getByLabel('Aller à la fiche n°').fill('42');
    await page.getByRole('button', { name: 'Ouvrir' }).click();
    await expect(page).toHaveURL(/fiche\/42\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fiche 42');
  });
});

test.describe('page d’une fiche', () => {
  test('révèle les réponses une par une ou toutes, et navigue', async ({ page }) => {
    await page.goto('fiche/1/');
    await choisirVoiture(page, 'Je ne sais pas encore');
    const voir = page.getByRole('button', { name: 'Voir la réponse' });
    await expect(voir).toHaveCount(3);
    await voir.first().click();
    await expect(page.getByText('Dispositif situé en général à gauche du volant.')).toBeVisible();
    await expect(page.getByText('demande à ton moniteur de te montrer')).toBeVisible();
    await page.getByRole('button', { name: 'Tout afficher' }).click();
    await expect(page.getByRole('button', { name: 'Masquer la réponse' })).toHaveCount(3);
    await page.getByRole('link', { name: 'Fiche 2' }).click();
    await expect(page).toHaveURL(/fiche\/2\/$/);
    await page.getByRole('link', { name: 'Fiche 1' }).click();
    await page.getByRole('link', { name: 'Fiche 100' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fiche 100');
  });
});

test.describe('entraînement', () => {
  test('série complète de 10 fiches, bilan et reprise des questions à revoir', async ({ page }) => {
    await page.goto('entrainement/');
    await choisirVoiture(page, 'Clio 5');
    await page.getByRole('button', { name: /10 fiches au hasard/ }).click();

    let i = 0;
    const bilan = page.getByRole('heading', { name: /sur 30/ });
    while (!(await bilan.isVisible())) {
      const trouve = page.locator('.trouve');
      if (await trouve.isVisible()) {
        // Mode Trouve l'élément : on choisit dans la liste (chemin clavier) ou on touche la photo.
        await page.locator('.vis-scene').click({ position: { x: 5, y: 5 } });
        await page.getByRole('button', { name: 'Valider', exact: true }).click();
        await page.locator('[data-continuer]').click();
      } else {
        await page.getByRole('button', { name: 'Voir la réponse' }).click();
        await page.getByRole('button', { name: i % 3 === 0 ? 'À revoir' : 'Je savais' }).click();
      }
      i++;
      expect(i).toBeLessThanOrEqual(30);
    }
    expect(i).toBe(30);
    await expect(page.getByRole('heading', { name: 'À revoir' })).toBeVisible();
    const aRevoir = await page.locator('[data-a-revoir] li').count();
    expect(aRevoir).toBeGreaterThanOrEqual(10);

    await page.getByRole('button', { name: 'Recommencer seulement celles à revoir' }).click();
    await expect(page.getByText(new RegExp(`À revoir · 1/${aRevoir}`))).toBeVisible();
  });
});

test.describe('examen blanc', () => {
  test('tirage au compteur animé, 3 questions, résultat sur 3', async ({ page }) => {
    await page.goto('examen/');
    await choisirVoiture(page, 'Je ne sais pas encore');
    await page.getByRole('button', { name: 'Lancer le compteur' }).click();
    const tirage = page.locator('[data-tirage-resultat]');
    await expect(tirage).toContainText(/c’est la fiche \d+/, { timeout: 10_000 });
    const numero = Number((await tirage.textContent())!.match(/fiche (\d+)/)![1]);
    const km = (await tirage.textContent())!.replace(/\D+km[\s\S]*/, '').replace(/\D/g, '');
    expect(numero).toBe(Number(km.slice(-2)) || 100); // 2 derniers chiffres, 00 → 100

    await page.getByRole('button', { name: 'Commencer l’examen' }).click();
    for (let q = 0; q < 3; q++) {
      await expect(page.getByText(`question ${q + 1} sur 3`)).toBeVisible();
      await page.getByRole('button', { name: 'Voir la réponse' }).click();
      await page.getByRole('button', { name: q === 1 ? 'À revoir' : 'Je savais' }).click();
    }
    await expect(page.getByRole('heading', { name: '2 points sur 3' })).toBeVisible();
    await expect(page.locator('.recap-item')).toHaveCount(3);
    await expect(page.getByRole('link', { name: `Voir la fiche ${numero}` })).toBeVisible();
  });

  test('saisie des 2 derniers chiffres : 00 donne la fiche 100', async ({ page }) => {
    await page.goto('./');
    await choisirVoiture(page, 'Je ne sais pas encore');
    await examenSurFiche(page, '00');
    await expect(page.getByText('Fiche 100 · question 1 sur 3')).toBeVisible();
  });
});
