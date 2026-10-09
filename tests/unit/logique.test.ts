import { describe, it, expect } from 'vitest';
import { ficheDepuisCompteur, chiffresCompteur, formaterKm, compteurAleatoire } from '../../src/lib/compteur';
import { bilanSerie, bilanExamen, messageExamen, melanger, type Resultat } from '../../src/lib/score';
import { normaliser, filtrerFiches, correspond, texteIndexe } from '../../src/lib/recherche';
import { FICHES, fiche, voisines } from '../../src/lib/fiches';

describe('compteur → fiche', () => {
  it.each([
    ['00', 100],
    ['26', 26],
    ['05', 5],
    ['5', 5],
    ['54726', 26],
    ['54 726', 26],
    ['100', 100],
    ['199', 99],
  ])('« %s » donne la fiche %i', (saisie, attendu) => {
    expect(ficheDepuisCompteur(saisie)).toBe(attendu);
  });

  it('accepte un kilométrage numérique', () => {
    expect(ficheDepuisCompteur(54726)).toBe(26);
    expect(ficheDepuisCompteur(120400)).toBe(100);
    expect(ficheDepuisCompteur(7)).toBe(7);
  });

  it('refuse une saisie non numérique', () => {
    expect(() => ficheDepuisCompteur('')).toThrow(RangeError);
    expect(() => ficheDepuisCompteur('2a')).toThrow(RangeError);
  });

  it('produit toujours une fiche de 1 à 100', () => {
    for (let km = 0; km < 1000; km++) {
      const n = ficheDepuisCompteur(km);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(100);
    }
  });

  it('formate le compteur', () => {
    expect(chiffresCompteur(54726)).toEqual(['0', '5', '4', '7', '2', '6']);
    expect(formaterKm(54726)).toBe('54 726 km');
    expect(compteurAleatoire(() => 0.999999)).toBeLessThan(1_000_000);
  });
});

describe('scores', () => {
  const r = (fiche: number, partie: Resultat['partie'], ok: boolean): Resultat => ({ fiche, partie, ok, mode: 'auto' });

  it('compte 1 point par question réussie et liste celles à revoir', () => {
    const bilan = bilanSerie([r(1, 'verification', true), r(1, 'securite', false), r(1, 'secours', true), r(2, 'verification', false)]);
    expect(bilan.points).toBe(2);
    expect(bilan.total).toBe(4);
    expect(bilan.aRevoir).toEqual([
      { fiche: 1, partie: 'securite' },
      { fiche: 2, partie: 'verification' },
    ]);
  });

  it('note un examen blanc sur 3', () => {
    expect(bilanExamen([r(26, 'verification', true), r(26, 'securite', true), r(26, 'secours', false)]).points).toBe(2);
    expect(() => bilanExamen([r(26, 'verification', true)])).toThrow();
  });

  it('a un message pour chaque score d’examen', () => {
    const messages = [0, 1, 2, 3].map(messageExamen);
    expect(new Set(messages).size).toBe(4);
  });

  it('mélange sans perdre ni dupliquer', () => {
    const liste = Array.from({ length: 100 }, (_, i) => i + 1);
    let graine = 42;
    const aleatoire = () => ((graine = (graine * 16807) % 2147483647) - 1) / 2147483646;
    const m = melanger(liste, aleatoire);
    expect([...m].sort((a, b) => a - b)).toEqual(liste);
    expect(m).not.toEqual(liste);
  });
});

describe('recherche', () => {
  it('ignore accents, casse et apostrophes typographiques', () => {
    expect(normaliser('Éthylotest À L’ARRIÈRE')).toBe("ethylotest a l'arriere");
    expect(normaliser('Œil')).toBe('oeil');
  });

  it('trouve les fiches sans tenir compte des accents ni de la casse', () => {
    const a = filtrerFiches(FICHES, 'ETHYLOTEST');
    const b = filtrerFiches(FICHES, 'éthylotest');
    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(b);
    expect(a).toContain(17);
  });

  it('combine les mots (ET logique) et le filtre de type', () => {
    const toutes = filtrerFiches(FICHES, 'liquide frein');
    expect(toutes).toEqual(expect.arrayContaining([8, 70]));
    for (const n of filtrerFiches(FICHES, 'liquide frein', 'interieure')) expect(fiche(n).type).toBe('interieure');
    expect(filtrerFiches(FICHES, '', 'exterieure')).toHaveLength(50);
  });

  it('trouve une fiche par son numéro', () => {
    expect(correspond(texteIndexe(fiche(42)), '42')).toBe(true);
  });
});

describe('navigation entre fiches', () => {
  it('boucle de 1 à 100', () => {
    expect(voisines(1)).toEqual({ precedente: 100, suivante: 2 });
    expect(voisines(100)).toEqual({ precedente: 99, suivante: 1 });
  });
});
