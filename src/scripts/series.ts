// Construction des séries et bilan (partagé entraînement / examen).
import { PARTIES, libellePartie, type Fiche } from '../lib/fiches';
import { melanger, type Item } from '../lib/score';
import { icone } from '../lib/icones';
import { BASE, animationsReduites, echapper } from './commun';

export type TypeSerie = 'hasard' | 'toutes' | 'interieures' | 'exterieures' | 'revoir';

export const NOMS_SERIES: Record<TypeSerie, string> = {
  hasard: '10 fiches au hasard',
  toutes: 'Toutes les fiches',
  interieures: 'Vérifications intérieures',
  exterieures: 'Vérifications extérieures',
  revoir: 'Questions à revoir',
};

export function itemsSerie(type: Exclude<TypeSerie, 'revoir'>, fiches: Fiche[], aleatoire: () => number = Math.random): Item[] {
  let choisies: Fiche[];
  if (type === 'hasard') choisies = melanger(fiches, aleatoire).slice(0, 10);
  else if (type === 'interieures') choisies = fiches.filter((f) => f.type === 'interieure');
  else if (type === 'exterieures') choisies = fiches.filter((f) => f.type === 'exterieure');
  else choisies = fiches;
  return choisies.flatMap((f) => PARTIES.map((partie) => ({ fiche: f.numero, partie })));
}

export function htmlARevoir(items: Item[], fiches: Fiche[]): string {
  return items
    .map(({ fiche, partie }) => {
      const f = fiches[fiche - 1];
      return `<li><a href="${BASE}fiche/${fiche}/">
        <span class="numero">${fiche}</span>
        <span class="corps"><span class="type">${libellePartie(partie, f.type)}</span><span class="q">${echapper(f[partie].question)}</span></span>
        ${icone('fleche-droite', 'chevron')}
      </a></li>`;
    })
    .join('');
}

/** Affiche le score avec un petit défilement (désactivé si mouvement réduit). */
export function animerScore(el: HTMLElement, valeur: number): void {
  if (animationsReduites() || valeur === 0) {
    el.textContent = String(valeur);
    return;
  }
  const debut = performance.now();
  const duree = 650;
  const etape = (t: number) => {
    const p = Math.min(1, (t - debut) / duree);
    el.textContent = String(Math.round(valeur * (1 - (1 - p) ** 3)));
    if (p < 1) requestAnimationFrame(etape);
  };
  requestAnimationFrame(etape);
}
