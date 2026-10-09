// Le jour de l'examen, l'inspecteur choisit la fiche avec les 2 derniers
// chiffres du compteur kilométrique total : 54 726 km → fiche 26, …00 → fiche 100.

/** Numéro de fiche (1 à 100) à partir d'un kilométrage ou des 2 derniers chiffres saisis. */
export function ficheDepuisCompteur(entree: number | string): number {
  const chiffres = typeof entree === 'number' ? String(Math.trunc(Math.abs(entree))) : entree.replace(/[\s  ]/g, '');
  if (!/^\d+$/.test(chiffres)) throw new RangeError(`Compteur invalide : « ${entree} »`);
  const deux = Number(chiffres.slice(-2));
  return deux === 0 ? 100 : deux;
}

/** Kilométrage plausible tiré au hasard (6 chiffres affichés). */
export function compteurAleatoire(aleatoire: () => number = Math.random): number {
  return Math.floor(aleatoire() * 1_000_000);
}

/** « 054726 » → ['0','5','4','7','2','6'] pour l'affichage en rouleaux. */
export function chiffresCompteur(km: number, longueur = 6): string[] {
  return String(Math.trunc(Math.abs(km)) % 10 ** longueur)
    .padStart(longueur, '0')
    .split('');
}

/** « 54 726 km » (espaces insécables fines, comme en français). */
export function formaterKm(km: number): string {
  return String(km).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' km';
}
