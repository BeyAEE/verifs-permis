// Liste des fiches : recherche instantanée, filtre de type, accès par numéro.
import { correspond } from '../lib/recherche';
import { BASE } from './commun';

const formulaire = document.querySelector<HTMLFormElement>('[data-recherche]')!;
const champ = document.getElementById('recherche') as HTMLInputElement;
const numero = document.getElementById('aller-numero') as HTMLInputElement;
const compte = document.querySelector<HTMLElement>('[data-compte]')!;
const vide = document.querySelector<HTMLElement>('[data-vide]')!;
const elements = [...document.querySelectorAll<HTMLLIElement>('li[data-fiche]')];

function filtrer(): void {
  const requete = champ.value;
  const type = (formulaire.querySelector<HTMLInputElement>('input[name="type"]:checked')?.value ?? 'toutes') as string;
  let visibles = 0;
  for (const li of elements) {
    const ok = (type === 'toutes' || li.dataset.type === type) && correspond(li.dataset.texte ?? '', requete);
    li.hidden = !ok;
    if (ok) visibles++;
  }
  compte.textContent = visibles === 1 ? '1 fiche' : `${visibles} fiches`;
  vide.hidden = visibles !== 0;
}

function allerA(): void {
  const n = Number(numero.value);
  if (Number.isInteger(n) && n >= 1 && n <= 100) {
    window.location.href = `${BASE}fiche/${n}/`;
  } else {
    numero.setCustomValidity('Choisis un numéro entre 1 et 100.');
    numero.reportValidity();
  }
}

champ.addEventListener('input', filtrer);
formulaire.addEventListener('change', filtrer);
formulaire.addEventListener('submit', (e) => {
  e.preventDefault();
  if (document.activeElement === numero) allerA();
});
numero.addEventListener('input', () => numero.setCustomValidity(''));
numero.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    allerA();
  }
});
document.querySelector('[data-aller]')?.addEventListener('click', allerA);

// Recherche transmise dans l'adresse (?q=…), pratique pour partager.
const q = new URLSearchParams(location.search).get('q');
if (q) champ.value = q;
filtrer();
