// Outils partagés par les scripts des pages.
import type { DonneesVehicule, Manifeste, ChoixVoiture } from '../lib/vehicules';
import type { Fiche } from '../lib/fiches';

export const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export interface DonneesClient {
  vehicules: Record<string, DonneesVehicule>;
  manifeste: Manifeste;
  localisables: number[];
}

let promesseVehicules: Promise<DonneesClient> | null = null;
let promesseFiches: Promise<Fiche[]> | null = null;

export function chargerVehicules(): Promise<DonneesClient> {
  promesseVehicules ??= fetch(BASE + 'donnees/vehicules.json').then((r) => {
    if (!r.ok) throw new Error('Données voitures indisponibles');
    return r.json();
  });
  return promesseVehicules;
}

export function chargerFiches(): Promise<Fiche[]> {
  promesseFiches ??= fetch(BASE + 'donnees/fiches.json')
    .then((r) => {
      if (!r.ok) throw new Error('Fiches indisponibles');
      return r.json();
    })
    .then((d) => d.fiches as Fiche[]);
  return promesseFiches;
}

/** Message lu par les lecteurs d'écran (zone aria-live globale). */
export function annoncer(message: string): void {
  const zone = document.getElementById('annonce');
  if (!zone) return;
  zone.textContent = '';
  // Laisse au lecteur d'écran le temps de voir le changement.
  window.setTimeout(() => (zone.textContent = message), 60);
}

const ENTITES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function echapper(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ENTITES[c]);
}

export function animationsReduites(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function libelleVoiture(choix: ChoixVoiture | null): string {
  switch (choix) {
    case 'clio5':
      return 'Clio 5';
    case 'yaris':
      return 'Yaris';
    case 'inconnue':
      return 'Voiture ?';
    default:
      return 'Ma voiture';
  }
}
