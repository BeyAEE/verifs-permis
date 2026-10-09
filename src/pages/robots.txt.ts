import type { APIRoute } from 'astro';
import { url } from '../lib/site';

export const GET: APIRoute = ({ site }) =>
  new Response(
    ['User-agent: *', `Disallow: ${url('editeur/')}`, '', `Sitemap: ${new URL(url('sitemap-index.xml'), site).href}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
