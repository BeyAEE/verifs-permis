import { describe, it, expect } from 'vitest';
import { choixQcu, similarite, SEUIL_SIMILARITE } from '../../src/lib/qcu';
import { FICHES, PARTIES } from '../../src/lib/fiches';
import { normaliser } from '../../src/lib/recherche';
import pictos from '../../src/data/pictogrammes.json';

const PICTOS = pictos.pictogrammes;
let graine = 7;
const aleatoire = () => ((graine = (graine * 16807) % 2147483647) - 1) / 2147483646;

describe('QCU', () => {
  it('propose 3 choix dont une seule bonne réponse, sur toutes les questions de sécurité et de secours', () => {
    for (const f of FICHES)
      for (const partie of ['securite', 'secours'] as const) {
        const choix = choixQcu(f, partie, FICHES, PICTOS, aleatoire);
        expect(choix, `fiche ${f.numero} ${partie}`).not.toBeNull();
        expect(choix).toHaveLength(3);
        expect(choix!.filter((c) => c.correct)).toHaveLength(1);
        expect(choix!.find((c) => c.correct)!.texte).toBe(f[partie].reponse);
      }
  });

  it('ne prend que des réponses officielles d’autres fiches, jamais un texte inventé', () => {
    const officielles = new Set(FICHES.flatMap((f) => PARTIES.map((p) => f[p].reponse)));
    for (let i = 0; i < 300; i++) {
      const f = FICHES[i % 100];
      const choix = choixQcu(f, i % 2 ? 'securite' : 'secours', FICHES, PICTOS, aleatoire)!;
      for (const c of choix) expect(officielles.has(c.texte!)).toBe(true);
    }
  });

  it('n’utilise jamais la réponse d’une fiche qui pose la même question, ni une réponse trop proche', () => {
    for (let essai = 0; essai < 5; essai++)
      for (const f of FICHES)
        for (const partie of ['securite', 'secours'] as const) {
          for (const c of choixQcu(f, partie, FICHES, PICTOS, aleatoire)!.filter((x) => !x.correct)) {
            const source = FICHES[c.fiche - 1];
            expect(normaliser(source[partie].question)).not.toBe(normaliser(f[partie].question));
            expect(similarite(c.texte!, f[partie].reponse)).toBeLessThan(SEUIL_SIMILARITE);
          }
        }
  });

  it('les 3 choix sont différents', () => {
    for (const f of FICHES) {
      const textes = choixQcu(f, 'secours', FICHES, PICTOS, aleatoire)!.map((c) => normaliser(c.texte!));
      expect(new Set(textes).size).toBe(3);
    }
  });

  it('vérification : QCU de pictogrammes seulement quand la fiche en a un', () => {
    const avecPicto = new Set(PICTOS.map((p) => p.fiche));
    for (const f of FICHES) {
      const choix = choixQcu(f, 'verification', FICHES, PICTOS, aleatoire);
      if (!avecPicto.has(f.numero)) {
        expect(choix, `fiche ${f.numero}`).toBeNull();
        continue;
      }
      expect(choix).toHaveLength(3);
      const bonne = choix!.find((c) => c.correct)!;
      expect(bonne.image!.fiche).toBe(f.numero);
      // Pas deux fois le même voyant (ex. les deux images du voyant de freinage).
      expect(new Set(choix!.map((c) => c.image!.alt)).size).toBe(3);
    }
  });
});

describe('pictogrammes', () => {
  it('ne concernent que des vérifications intérieures sans réponse écrite', () => {
    expect(PICTOS).toHaveLength(22);
    for (const p of PICTOS) {
      const f = FICHES[p.fiche - 1];
      expect(f.type, `fiche ${p.fiche}`).toBe('interieure');
      expect(f.verification.reponse).toBe('');
      expect(p.alt.length).toBeGreaterThan(20);
    }
  });
});
