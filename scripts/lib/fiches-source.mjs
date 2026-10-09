// Lecture du bloc `const FICHES=[...]` de l'outil moniteur.
// Partagé entre le script d'import et le test d'intégrité : les deux doivent
// interpréter la source exactement de la même façon.
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const DEBUT = 'const FICHES=[';
const FIN = '\n];';

/** Extrait le bloc littéral, tel quel, depuis le HTML de l'outil moniteur. */
export function extraireBloc(html) {
  const i = html.indexOf(DEBUT);
  if (i === -1) throw new Error('Bloc « const FICHES=[ » introuvable dans la source');
  const j = html.indexOf(FIN, i);
  if (j === -1) throw new Error('Fin du bloc FICHES introuvable');
  return html.slice(i, j + FIN.length);
}

/**
 * Évalue le littéral dans un contexte vide (aucune variable globale, délai court).
 * Retourne le tableau brut { n, t, vq, vr, qq, qr, sq, sr }.
 */
export function lireBloc(bloc) {
  const expr = '(' + bloc.slice('const FICHES='.length).replace(/;\s*$/, '') + ')';
  return vm.runInNewContext(expr, Object.create(null), { timeout: 1000 });
}

export function sha256(texte) {
  return createHash('sha256').update(texte, 'utf8').digest('hex');
}

const TYPES = { VI: 'interieure', VE: 'exterieure' };

/** Conversion brute → schéma public. Aucun texte n'est modifié. */
export function versSchema(brutes) {
  return brutes.map((f) => {
    if (!(f.t in TYPES)) throw new Error(`Fiche ${f.n} : type inconnu « ${f.t} »`);
    return {
      numero: f.n,
      type: TYPES[f.t],
      verification: { question: f.vq, reponse: f.vr },
      securite: { question: f.qq, reponse: f.qr },
      secours: { question: f.sq, reponse: f.sr },
    };
  });
}

/** Correspondance champ du schéma ↔ clé de la source, pour les comparaisons. */
export const CHAMPS = [
  ['verification', 'question', 'vq'],
  ['verification', 'reponse', 'vr'],
  ['securite', 'question', 'qq'],
  ['securite', 'reponse', 'qr'],
  ['secours', 'question', 'sq'],
  ['secours', 'reponse', 'sr'],
];
