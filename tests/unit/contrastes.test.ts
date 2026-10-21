// Contrastes WCAG AA des couleurs du thème, lues directement dans le CSS
// (clair et sombre) : un changement de couleur qui casse l'AA fait échouer la CI.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/global.css', 'utf8');

function jetons(bloc: string, base: Record<string, string> = {}): Record<string, string> {
  const brut: Record<string, string> = { ...base };
  for (const [, nom, valeur] of bloc.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)) brut[nom] = valeur.trim().toLowerCase();
  // Résout les références « var(--x) » vers des couleurs hexadécimales.
  const resoudre = (v: string, profondeur = 0): string => {
    const m = /^var\(--([a-z0-9-]+)\)$/.exec(v);
    return m && profondeur < 5 ? resoudre(brut[m[1]] ?? '', profondeur + 1) : v;
  };
  return Object.fromEntries(
    Object.entries(brut)
      .map(([k, v]) => [k, resoudre(v)])
      .filter(([, v]) => /^#[0-9a-f]{6}$/.test(v)),
  );
}

const clair = jetons(css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)')));
const blocSombre = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
const sombre = jetons(blocSombre.slice(0, blocSombre.indexOf('\n}\n')), clair);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const BLANC = '#ffffff';
// [texte, fond, seuil] — 4,5 pour le texte, 3 pour les bordures de champs et les éléments graphiques.
const paires: Array<[string, string, number]> = [
  ['texte', 'fond', 4.5],
  ['texte', 'surface', 4.5],
  ['texte', 'surface-2', 4.5],
  ['texte-doux', 'fond', 4.5],
  ['texte-doux', 'surface', 4.5],
  ['texte-doux', 'surface-2', 4.5],
  ['lien', 'fond', 4.5],
  ['lien', 'surface', 4.5],
  ['lien', 'surface-2', 4.5],
  ['rouge-texte', 'surface', 4.5],
  ['rouge-texte', 'rouge-pale', 4.5],
  ['vert-texte', 'surface', 4.5],
  ['vert-texte', 'vert-pale', 4.5],
  ['bordure-champ', 'surface', 3],
  ['bordure-champ', 'fond', 3],
  ['focus', 'surface', 3],
  ['focus', 'fond', 3],
];
const surBlanc: Array<[string, number]> = [
  ['marine', 4.5],
  ['bouton', 4.5], // boutons principaux, numéros, segment actif (plus vif en sombre)
  ['rouge', 4.5], // bouton Examen blanc
  ['bouton-vert', 4.5], // « Je savais »
  ['entete', 4.5],
  ['bande', 4.5], // bande du titre « Vérifs permis B »
  ['nuit', 4.5],
];

describe.each([
  ['thème clair', clair],
  ['thème sombre', sombre],
])('contrastes WCAG AA — %s', (_nom, t) => {
  it.each(paires)('%s sur %s', (avant, fond, seuil) => {
    expect(t[avant], `--${avant} manquant`).toBeDefined();
    expect(t[fond], `--${fond} manquant`).toBeDefined();
    expect(contraste(t[avant], t[fond])).toBeGreaterThanOrEqual(seuil);
  });

  it.each(surBlanc)('texte blanc sur --%s', (fond, seuil) => {
    expect(contraste(BLANC, t[fond])).toBeGreaterThanOrEqual(seuil);
  });
});

it('le vert de la charte reste réservé aux éléments graphiques (3:1 sur blanc)', () => {
  expect(contraste(clair.vert, BLANC)).toBeGreaterThanOrEqual(3);
  expect(contraste(clair.vert, BLANC)).toBeLessThan(4.5); // d'où --vert-texte et --bouton-vert
});
