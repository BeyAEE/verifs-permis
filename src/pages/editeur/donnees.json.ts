// Données complètes pour l'éditeur (brouillons compris). Jamais pré-cachées.
import type { APIRoute } from 'astro';
import { VEHICULES, MANIFESTE } from '../../lib/site';
import localisables from '../../data/localisables.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ vehicules: VEHICULES, manifeste: MANIFESTE, localisables }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
