import type { APIRoute } from 'astro';
import { FICHES } from '../../lib/fiches';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ fiches: FICHES }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
