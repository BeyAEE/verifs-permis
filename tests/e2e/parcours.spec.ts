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

test.describe('progression', () => {
  test('gardée d’une visite à l’autre : accueil, liste des fiches, points faibles, effacement', async ({ page }) => {
    await page.goto('entrainement/');
    await choisirVoiture(page, 'Je ne sais pas encore');
    await expect(page.locator('[data-entrainement][data-pret="oui"]')).toBeAttached();
    await expect(page.getByRole('button', { name: /Mes points faibles/ })).toBeHidden();
    await expect(page.getByText('Ta progression')).toBeHidden();

    // Fiche 1 : 3 bonnes réponses (maîtrisée). Fiche 2 : vérification ratée.
    await page.getByRole('button', { name: /Toutes les fiches, dans l’ordre/ }).click();
    for (const reponse of ['Je savais', 'Je savais', 'Je savais', 'À revoir']) {
      await page.getByRole('button', { name: 'Voir la réponse' }).click();
      await page.getByRole('button', { name: reponse, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Arrêter la série' }).click();
    await expect(page.getByText('Ta progression : 1 fiche maîtrisée sur 100.')).toBeVisible();

    await page.goto('fiches/');
    await expect(page.locator('li[data-fiche="1"] .etat-fiche')).toHaveText('Maîtrisée');
    await expect(page.locator('li[data-fiche="2"] .etat-fiche')).toHaveText('À revoir');
    await expect(page.locator('li[data-fiche="3"] .etat-fiche')).toHaveCount(0);

    await page.goto('./');
    const carte = page.locator('[data-carte-progression]');
    await expect(carte).toContainText('1 / 100 fiches maîtrisées');
    await expect(carte).toContainText('1 question à revoir · 98 fiches jamais vues');
    await expect(carte.getByRole('progressbar', { name: 'Fiches maîtrisées' })).toHaveAttribute('aria-valuenow', '1');
    await carte.getByRole('link', { name: 'Revoir mes points faibles (1)' }).click();

    await expect(page).toHaveURL(/entrainement\/#points-faibles$/);
    const faibles = page.getByRole('button', { name: /Mes points faibles/ });
    await expect(faibles).toBeVisible();
    await expect(faibles).toContainText('1 question ratée la dernière fois');
    await faibles.click();
    await expect(page.getByText('Mes points faibles · 1/1')).toBeVisible();
    await page.getByRole('button', { name: 'Voir la réponse' }).click();
    await page.getByRole('button', { name: 'Je savais', exact: true }).click();
    await page.getByRole('button', { name: 'Nouvelle série' }).click();
    await expect(faibles).toBeHidden();

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Effacer ma progression' }).click();
    await expect(page.getByText('Ta progression', { exact: true })).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('verifs-permis:progression'))).toBeNull();
  });

  test('l’examen blanc compte aussi dans la progression', async ({ page }) => {
    await page.goto('./');
    await choisirVoiture(page, 'Je ne sais pas encore');
    await examenSurFiche(page, '07');
    for (let q = 0; q < 3; q++) {
      await page.getByRole('button', { name: 'Voir la réponse' }).click();
      await page.getByRole('button', { name: 'Je savais', exact: true }).click();
    }
    await expect(page.getByRole('heading', { name: '3 points sur 3' })).toBeVisible();
    await page.goto('./');
    await expect(page.locator('[data-carte-progression]')).toContainText('1 / 100 fiches maîtrisées');
  });
});

test.describe('page « Le jour J »', () => {
  test('l’animation se lance au clic, se met en pause et reprend', async ({ page }) => {
    await page.goto('le-jour-j/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('L’examen du permis B, étape par étape');
    const animation = page.locator('[data-animation-examen]');
    await animation.getByRole('button', { name: /Voir l’examen en 1/ }).click();
    await expect(animation.getByText('L’inspecteur vérifie ton identité', { exact: false })).toBeVisible({ timeout: 10_000 });
    const pause = animation.getByRole('button', { name: 'Mettre en pause' });
    await pause.click();
    const temps = await animation.locator('[data-temps]').textContent();
    await page.waitForTimeout(1200);
    await expect(animation.locator('[data-temps]')).toHaveText(temps!);
    await animation.getByRole('button', { name: 'Reprendre' }).click();
    await expect(animation.getByRole('button', { name: 'Mettre en pause' })).toBeVisible();
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

test.describe('QCU et pictogrammes', () => {
  test('entraînement en QCU : 3 choix, bonne ou mauvaise réponse, bilan', async ({ page }) => {
    await page.goto('entrainement/');
    await choisirVoiture(page, 'Je ne sais pas encore');
    await page.getByRole('radio', { name: 'QCU · 3 choix' }).check();
    await page.getByRole('button', { name: /10 fiches au hasard/ }).click();

    let qcuVus = 0;
    for (let i = 0; i < 30; i++) {
      const choix = page.locator('.choix-qcu');
      const voir = page.getByRole('button', { name: 'Voir la réponse' });
      await expect(choix.first().or(voir)).toBeVisible();
      if (await choix.first().isVisible()) {
        await expect(choix).toHaveCount(3);
        await choix.nth(i % 3).click();
        await expect(page.locator('.qcu-retour .verdict')).toBeVisible();
        await expect(page.locator('.choix-qcu.juste')).toHaveCount(1);
        await expect(page.locator('.choix-qcu[disabled]')).toHaveCount(3);
        qcuVus++;
        await page.locator('[data-suite]').click();
      } else {
        await voir.click();
        await page.getByRole('button', { name: 'Je savais' }).click();
      }
    }
    // Sécurité routière + premiers secours sont toujours en QCU : au moins 20 sur 30.
    expect(qcuVus).toBeGreaterThanOrEqual(20);
    await expect(page.getByRole('heading', { name: /sur 30/ })).toBeVisible();
  });

  test('fiche 51 : la réponse officielle est le pictogramme du voyant des feux de route', async ({ page }) => {
    await page.goto('fiche/51/');
    await choisirVoiture(page, 'Je ne sais pas encore');
    await page.getByRole('button', { name: 'Voir la réponse' }).first().click();
    const img = page.getByRole('img', { name: /Voyant bleu des feux de route/ });
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    await expect(page.getByText('Pas de réponse écrite')).toHaveCount(0);
  });
});

test.describe('repères de la voiture', () => {
  test('la Clio affiche son repère, sinon le rappel générique', async ({ page }) => {
    await page.goto('fiche/1/');
    await choisirVoiture(page, 'Clio 5');
    await page.getByRole('button', { name: 'Voir la réponse' }).first().click();
    await expect(page.getByText('Sur ta Clio 5 :')).toBeVisible();
    await expect(page.getByText('Repère de test : bouton à gauche du volant.')).toBeVisible();
    await expect(page.getByText('demande à ton moniteur de te montrer')).toHaveCount(0);

    await page.locator('header').getByRole('button', { name: /changer de voiture/ }).click();
    await choisirVoiture(page, 'Je ne sais pas encore');
    await expect(page.getByText('demande à ton moniteur de te montrer')).toBeVisible();
    await expect(page.getByText('Sur ta Clio 5 :')).toHaveCount(0);
  });
});
