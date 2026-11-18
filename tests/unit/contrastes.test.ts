// Contrastes WCAG AA des couleurs du thème (charte ECF 2026), lues directement
// dans le CSS : un changement de couleur qui casse l'AA fait échouer la CI.
// Le site n'a qu'un thème clair : la charte ECF ne prévoit pas de mode sombre.
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

const clair = jetons(css.slice(css.indexOf(':root {'), css.indexOf('/* ── Base')));

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
  ['texte', 'rouge-pale', 4.5], // sur fond rose, le texte reste foncé (rouge seulement en icône)
  ['vert-texte', 'surface', 4.5],
  ['vert-texte', 'vert-pale', 4.5],
  ['bordure-champ', 'surface', 3],
  ['bordure-champ', 'fond', 3],
  ['focus', 'surface', 3],
  ['focus', 'fond', 3],
];
const surBlanc: Array<[string, number]> = [
  ['marine', 4.5],
  ['bouton', 4.5], // boutons principaux, numéros, segment actif
  ['rouge', 4.5], // bouton Examen blanc, Appeler
  ['bouton-vert', 4.5], // « Je savais »
  ['entete', 4.5],
  ['bande', 4.5], // bande du titre « Vérifs permis B »
];

describe('contrastes WCAG AA — thème clair', () => {
  const t = clair;
  it.each(paires)('%s sur %s', (avant, fond, seuil) => {
    expect(t[avant], `--${avant} manquant`).toBeDefined();
    expect(t[fond], `--${fond} manquant`).toBeDefined();
    expect(contraste(t[avant], t[fond])).toBeGreaterThanOrEqual(seuil);
  });

  it.each(surBlanc)('texte blanc sur --%s', (fond, seuil) => {
    expect(contraste(BLANC, t[fond])).toBeGreaterThanOrEqual(seuil);
  });
});

it('le vert des zones (graphique) reste lisible sur blanc (3:1)', () => {
  expect(contraste(clair.vert, BLANC)).toBeGreaterThanOrEqual(3);
});

it('seules les couleurs de la charte ECF 2026 sont utilisées', () => {
  const charte = ['#124483', '#da1f26', '#ffffff', '#98c0f1', '#c0d9f6', '#e9f1fc', '#fce9e9', '#f0989b'];
  const texteEtSemantique = ['#191c21', '#5c626c', '#3c8a62', '#2f6b4f', '#e6f0ea'];
  const autorisees = new Set([...charte, ...texteEtSemantique]);
  const horsCharte = Object.values(clair).filter((c) => !autorisees.has(c));
  expect(horsCharte).toEqual([]);
});
