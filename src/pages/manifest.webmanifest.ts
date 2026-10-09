import type { APIRoute } from 'astro';
import { url } from '../lib/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: 'Vérifs permis B — ECF Albi',
      short_name: 'Vérifs permis',
      description: 'Révise les 100 fiches de vérification du permis B et entraîne-toi comme le jour de l’examen.',
      lang: 'fr',
      start_url: url(),
      scope: url(),
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#eef2f8',
      theme_color: '#0a2a57',
      icons: [
        { src: url('icones/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: url('icones/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: url('icones/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } },
  );
