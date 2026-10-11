import { describe, it, expect } from 'vitest';
import {
  CLE_PROGRESSION,
  vide,
  noter,
  lireProgression,
  ecrireProgression,
  effacerProgression,
  enregistrerReponse,
  etatQuestion,
  etatFiche,
  resume,
  pointsFaibles,
  type Progression,
} from '../../src/lib/progression';
import type { Item } from '../../src/lib/score';

/** Stockage en mémoire, même interface que localStorage. */
function stockageMemoire(initial: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(initial));
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

const v = (fiche: number): Item => ({ fiche, partie: 'verification' });
const s = (fiche: number): Item => ({ fiche, partie: 'securite' });
const p = (fiche: number): Item => ({ fiche, partie: 'secours' });

function suite(reponses: Array<[Item, boolean]>): Progression {
  return reponses.reduce((acc, [item, ok]) => noter(acc, item, ok), vide());
}

describe('progression', () => {
  it('garde les 3 dernières réponses de chaque question, sans modifier l’original', () => {
    const depart = vide();
    const apres = suite([
      [v(12), false],
      [v(12), true],
      [v(12), false],
      [v(12), true],
    ]);
    expect(depart.questions).toEqual({});
    expect(apres.questions['12:verification']).toBe('101');
  });

  it('la dernière réponse fait foi pour la question et pour la fiche', () => {
    let prog = suite([
      [v(5), true],
      [s(5), true],
    ]);
    expect(etatQuestion(prog, 5, 'secours')).toBe('jamais');
    expect(etatFiche(prog, 5)).toBe('commencee');

    prog = noter(prog, p(5), true);
    expect(etatFiche(prog, 5)).toBe('maitrisee');

    prog = noter(prog, s(5), false);
    expect(etatQuestion(prog, 5, 'securite')).toBe('a-revoir');
    expect(etatFiche(prog, 5)).toBe('a-revoir');

    prog = noter(prog, s(5), true); // rattrapée
    expect(etatFiche(prog, 5)).toBe('maitrisee');
    expect(etatFiche(prog, 6)).toBe('jamais');
  });

  it('résume : fiches maîtrisées, à revoir, jamais vues', () => {
    const prog = suite([
      [v(1), true],
      [s(1), true],
      [p(1), true],
      [v(2), false],
      [s(2), false],
      [v(3), true],
    ]);
    expect(resume(prog)).toEqual({ repondues: 6, maitrisees: 1, fichesARevoir: 1, questionsARevoir: 2, jamaisVues: 97 });
  });

  it('« Mes points faibles » ne reprend que les questions ratées la dernière fois, sans dépasser le maximum', () => {
    const prog = suite([
      [v(1), false],
      [v(1), true],
      [s(2), false],
      [p(3), false],
      [v(4), true],
    ]);
    const items = pointsFaibles(prog, 30, () => 0);
    expect(items).toHaveLength(2);
    expect(items).toEqual(expect.arrayContaining([s(2), p(3)]));

    const beaucoup = suite(Array.from({ length: 50 }, (_, i) => [v(i + 1), false] as [Item, boolean]));
    expect(pointsFaibles(beaucoup, 30)).toHaveLength(30);
    expect(pointsFaibles(vide())).toEqual([]);
  });

  it('lit, écrit et efface dans le stockage local', () => {
    const stockage = stockageMemoire();
    enregistrerReponse(v(8), false, stockage);
    enregistrerReponse(v(8), true, stockage);
    enregistrerReponse(s(8), false, stockage);
    expect(JSON.parse(stockage.getItem(CLE_PROGRESSION)!)).toEqual({ version: 1, questions: { '8:verification': '01', '8:securite': '0' } });
    expect(lireProgression(stockage).questions['8:verification']).toBe('01');

    effacerProgression(stockage);
    expect(stockage.getItem(CLE_PROGRESSION)).toBeNull();
    expect(lireProgression(stockage)).toEqual(vide());
  });

  it('ignore une donnée abîmée ou modifiée à la main', () => {
    const abimee = stockageMemoire({ [CLE_PROGRESSION]: '{pas du json' });
    expect(lireProgression(abimee)).toEqual(vide());

    const bricolee = stockageMemoire({
      [CLE_PROGRESSION]: JSON.stringify({
        version: 1,
        questions: { '8:verification': '1', '0:securite': '1', '101:secours': '1', '9:autre': '1', '10:secours': '12', '11:secours': 1 },
      }),
    });
    expect(lireProgression(bricolee).questions).toEqual({ '8:verification': '1' });
  });

  it('reste utilisable si le stockage est indisponible', () => {
    const plein = { ...stockageMemoire(), setItem: () => { throw new Error('QuotaExceededError'); } } as Storage;
    expect(() => enregistrerReponse(v(1), true, plein)).not.toThrow();
    expect(() => ecrireProgression(vide(), undefined)).not.toThrow();
    expect(lireProgression(undefined)).toEqual(vide());
  });
});
