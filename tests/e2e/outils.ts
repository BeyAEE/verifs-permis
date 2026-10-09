import { test as base, expect, type Page, type Locator } from '@playwright/test';

/** Chaque test échoue s'il y a une erreur dans la console ou une exception. */
export const test = base.extend<{ erreurs: string[] }>({
  erreurs: [
    async ({ page }, use) => {
      const erreurs: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') erreurs.push(m.text());
      });
      page.on('pageerror', (e) => erreurs.push(e.message));
      await use(erreurs);
      expect(erreurs, 'erreurs dans la console').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Choisit la voiture dans la fenêtre du premier lancement. */
export async function choisirVoiture(page: Page, nom: 'Clio 5' | 'Yaris' | 'Je ne sais pas encore'): Promise<void> {
  const fenetre = page.getByRole('dialog', { name: 'Tu apprends sur quelle voiture ?' });
  await expect(fenetre).toBeVisible();
  await fenetre.getByRole('button', { name: new RegExp(nom) }).click();
  await expect(fenetre).toBeHidden();
}

/** Touche un point de la photo, en % de l'image (tap sur mobile, clic sinon). */
export async function toucherPhoto(page: Page, scene: Locator, x: number, y: number): Promise<void> {
  await scene.scrollIntoViewIfNeeded();
  const boite = (await scene.boundingBox())!;
  const position = { x: (boite.width * x) / 100, y: (boite.height * y) / 100 };
  const tactile = (page.context() as any)._options?.hasTouch;
  if (tactile) await scene.tap({ position });
  else await scene.click({ position });
}

/** Démarre un examen blanc sur une fiche précise via la saisie des 2 chiffres. */
export async function examenSurFiche(page: Page, deuxChiffres: string): Promise<void> {
  await page.goto('examen/');
  await expect(page.locator('[data-examen][data-pret="oui"]')).toBeAttached();
  // Un examen en cours reprend automatiquement : on l'abandonne d'abord.
  const abandonner = page.getByRole('button', { name: 'Abandonner l’examen' });
  if (await abandonner.isVisible()) await abandonner.click();
  await page.getByLabel('Tu es en voiture avec ton moniteur ?').fill(deuxChiffres);
  await page.getByRole('button', { name: 'C’est parti' }).click();
}
