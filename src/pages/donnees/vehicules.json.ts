import type { APIRoute } from 'astro';
import { donneesClient } from '../../lib/site';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(donneesClient()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
