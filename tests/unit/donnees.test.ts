// Intégrité des fiches : exécuté en CI à chaque push.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lireBloc, sha256, CHAMPS } from '../../scripts/lib/fiches-source.mjs';
import fichesJson from '../../src/data/fiches.json';
import localisables from '../../src/data/localisables.json';
import clio5 from '../../src/data/vehicules/clio5.json';
import yaris from '../../src/data/vehicules/yaris.json';
import { validerVehicule } from '../../src/lib/editeur-io';

const bloc = readFileSync('data/source/fiches-outil-moniteur.js', 'utf8').replace(/\n$/, '');
const provenance = JSON.parse(readFileSync('data/source/SOURCE.json', 'utf8'));
const source = lireBloc(bloc) as Array<Record<string, string | number>>;
const fiches = fichesJson.fiches;

// La source n'a pas de réponse écrite pour ces vérifications (gestes à faire ou
// à montrer). Documenté dans DATA_REVIEW.md ; toute évolution doit être voulue.
const SANS_REPONSE_VERIFICATION = [
  5, 10, 11, 13, 15, 17, 23, 25, 27, 29, 31, 32, 33, 34, 35, 37, 38, 39, 41, 42, 43, 45, 47, 48, 49, 51, 53, 54, 55, 57, 58,
  59, 60, 62, 64, 66, 69, 73, 75, 77, 81, 83, 84, 85, 86, 87, 88, 89, 91, 93, 94, 95, 97, 98, 100,
];

describe('fiches.json', () => {
  it('contient 100 fiches numérotées de 1 à 100, sans trou ni doublon', () => {
    expect(fiches).toHaveLength(100);
    expect(fiches.map((f) => f.numero)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });

  it('a un type valide pour chaque fiche', () => {
    for (const f of fiches) expect(['interieure', 'exterieure']).toContain(f.type);
  });

  it('a tous ses champs remplis (sauf les réponses de vérification absentes de la source)', () => {
    const vides: number[] = [];
    for (const f of fiches) {
      for (const [partie, champ] of CHAMPS) {
        const valeur = (f as any)[partie][champ];
        expect(typeof valeur, `fiche ${f.numero} ${partie}.${champ}`).toBe('string');
        if (valeur.trim() === '') {
          if (partie === 'verification' && champ === 'reponse') vides.push(f.numero);
          else throw new Error(`Fiche ${f.numero} : ${partie}.${champ} est vide`);
        }
      }
    }
    expect(vides).toEqual(SANS_REPONSE_VERIFICATION);
  });

  it('reprend le texte de la source caractère par caractère', () => {
    expect(source).toHaveLength(100);
    for (const f of fiches) {
      const s = source[f.numero - 1];
      expect(s.n).toBe(f.numero);
      expect(f.type).toBe(s.t === 'VI' ? 'interieure' : 'exterieure');
      for (const [partie, champ, cle] of CHAMPS) {
        expect((f as any)[partie][champ], `fiche ${f.numero} ${partie}.${champ}`).toBe(s[cle]);
      }
    }
  });

  it('correspond à la copie de la source enregistrée (sha256)', () => {
    expect(sha256(bloc)).toBe(provenance.sha256);
    expect(fichesJson.source.sha256).toBe(provenance.sha256);
  });
});

describe('localisables.json', () => {
  it('ne liste que des vérifications extérieures, sans doublon', () => {
    const numeros = [...localisables.fiches, ...localisables.aArbitrer].map((l) => l.numero);
    expect(new Set(numeros).size).toBe(numeros.length);
    for (const n of numeros) expect(fiches[n - 1].type, `fiche ${n}`).toBe('exterieure');
  });
});

describe('fichiers voiture', () => {
  it.each([
    ['clio5', clio5],
    ['yaris', yaris],
  ])('%s est valide', (_id, donnees) => {
    const v = validerVehicule(donnees);
    expect(v.ok ? [] : v.erreurs).toEqual([]);
  });

  it('les zones visent des fiches localisables', () => {
    const ok = new Set(localisables.fiches.map((l) => l.numero));
    for (const d of [clio5, yaris]) for (const z of d.zones as any[]) for (const n of z.fiches) expect(ok.has(n), `zone ${z.id} fiche ${n}`).toBe(true);
  });

  it.each([
    ['clio5', clio5],
    ['yaris', yaris],
  ])('les repères de %s visent chaque fiche une seule fois, et jamais une fiche qui a déjà sa zone', (_id, donnees) => {
    // Un repère sur une vérification extérieure sert quand la photo ne peut pas
    // aider (ex. batterie de la Yaris hybride, sous la banquette arrière).
    const avecZone = new Set((donnees.zones as any[]).flatMap((z) => z.fiches));
    const vues = new Set<number>();
    for (const r of (donnees as any).reperes ?? []) {
      for (const n of r.fiches) {
        if (fiches[n - 1].type === 'exterieure') expect(avecZone.has(n), `fiche ${n} : zone et repère`).toBe(false);
        expect(vues.has(n), `fiche ${n} en double`).toBe(false);
        vues.add(n);
      }
    }
  });
});

describe('notes « Bon à savoir »', () => {
  it('visent des fiches existantes et citent une source', async () => {
    const notes = (await import('../../src/data/notes.json')).default.notes;
    for (const n of notes) {
      for (const f of n.fiches) expect(f >= 1 && f <= 100, `fiche ${f}`).toBe(true);
      expect(n.texte.length).toBeGreaterThan(20);
      expect(n.source.length).toBeGreaterThan(10);
    }
  });
});
