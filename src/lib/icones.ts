// Icônes au trait (24×24), partagées entre les pages Astro et les scripts.
const tracés: Record<string, string> = {
  accueil: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  liste: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="12" r="1.2"/><circle cx="3.5" cy="18" r="1.2"/>',
  cible: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  compteur: '<path d="M4.5 17a9 9 0 1 1 15 0"/><path d="m12 13 4-5"/><circle cx="12" cy="13.5" r="1.4"/><path d="M8 20h8"/>',
  voiture:
    '<path d="M5 16V11.5l1.8-4.6A2 2 0 0 1 8.7 5.6h6.6a2 2 0 0 1 1.9 1.3L19 11.5V16"/><path d="M3.5 16h17v2.5a1 1 0 0 1-1 1H18a1 1 0 0 1-1-1V18H7v.5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1z"/><path d="M5 11.5h14"/><circle cx="7.5" cy="14" r=".6"/><circle cx="16.5" cy="14" r=".6"/>',
  volant: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M3.5 10.5 9.6 12M14.4 12l6.1-1.5M12 14.5V21"/>',
  exterieur:
    '<path d="M2 15.5V13l2-4.5A2 2 0 0 1 5.8 7.3h7.6a2 2 0 0 1 1.6.8L18 12l3 .8a1.5 1.5 0 0 1 1 1.4v1.3"/><circle cx="6.5" cy="16" r="2"/><circle cx="17.5" cy="16" r="2"/><path d="M8.5 16h7M4.5 16H2M22 16h-2.5M9 12h9"/>',
  securite: '<path d="M12 3 4 6v6c0 4.6 3.4 8 8 9 4.6-1 8-4.4 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  secours: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 7.5v9M7.5 12h9"/>',
  'fleche-gauche': '<path d="M15 5 8 12l7 7"/>',
  'fleche-droite': '<path d="m9 5 7 7-7 7"/>',
  oeil: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'zoom-plus': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>',
  'zoom-moins': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/>',
  'plein-ecran': '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  reduire: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  recadrer: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
  fermer: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  croix: '<path d="M6 6l12 12M18 6 6 18"/>',
  doigt: '<path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10m0 0V8.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.3 14a1.5 1.5 0 0 1 2.4-1.8L7.5 14V11"/>',
  telephone:
    '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
  hors_ligne: '<path d="M2 8.8a15 15 0 0 1 20 0M5.5 12.4a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1"/>',
  telechargement: '<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 20h14"/>',
  copier: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
};

export type NomIcone = keyof typeof tracés;

export function icone(nom: string, classe = ''): string {
  const t = tracés[nom];
  if (!t) throw new Error(`Icône inconnue : ${nom}`);
  return `<svg${classe ? ` class="${classe}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${t}</svg>`;
}

/** Silhouette de citadine pour les cartes voiture (en attendant les vraies photos). */
export const SILHOUETTE =
  '<svg viewBox="0 0 64 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 24v-5.5c0-1.4 1-2.6 2.4-2.9l7.8-1.6 6.2-6.1c.9-.9 2.1-1.4 3.4-1.4h15.4c1.6 0 3.1.8 4 2.1l4.4 5.6 7.2 1.6c1.4.3 2.4 1.6 2.4 3V24"/><circle cx="16" cy="24.5" r="4.5"/><circle cx="48" cy="24.5" r="4.5"/><path d="M20.5 24.5h23M24 14h22"/></svg>';
