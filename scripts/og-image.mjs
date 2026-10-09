#!/usr/bin/env node
// Image de partage 1200×630 aux couleurs ECF → public/og.png
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Polices intégrées en data: URI (une page vierge ne peut pas lire file://).
const polices = {};
for (const g of [500, 700]) {
  const fichier = fileURLToPath(new URL(`../node_modules/@fontsource/poppins/files/poppins-latin-${g}-normal.woff2`, import.meta.url));
  polices[g] = 'data:font/woff2;base64,' + (await readFile(fichier)).toString('base64');
}
const police = (graisse) => polices[graisse];
const logo = (await readFile('public/logo-ecf.png')).toString('base64');

const html = `<!doctype html><html><head><style>
@font-face{font-family:P;font-weight:500;src:url(${police(500)})}
@font-face{font-family:P;font-weight:700;src:url(${police(700)})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;font-family:P;color:#fff;background:linear-gradient(135deg,#0a2a57 0%,#124483 100%);position:relative;overflow:hidden}
.bande{position:absolute;left:0;right:0;bottom:0;height:14px;background:#db1418}
.cercle{position:absolute;right:-120px;top:-140px;width:520px;height:520px;border-radius:50%;background:rgba(255,255,255,.06)}
.contenu{position:absolute;left:80px;top:72px;right:80px}
.marque{display:flex;align-items:center;gap:20px;margin-bottom:56px}
.marque img{width:92px;height:92px;background:#fff;border-radius:26px;padding:8px}
.marque span{font-size:34px;font-weight:700}.marque small{display:block;font-size:24px;font-weight:500;opacity:.8}
h1{font-size:68px;line-height:1.05;letter-spacing:-2px;max-width:820px}
p{margin-top:26px;font-size:30px;font-weight:500;opacity:.9}
.compteur{position:absolute;right:80px;bottom:80px;display:flex;gap:8px;padding:12px;border-radius:22px;background:#050b16}
.compteur b{width:58px;height:80px;border-radius:12px;background:#16233b;display:flex;align-items:center;justify-content:center;font-size:50px}
.compteur b.cle{background:#db1418}
</style></head><body>
<div class="cercle"></div>
<div class="contenu">
  <div class="marque"><img src="data:image/png;base64,${logo}"><span>Vérifs permis<small>ECF Albi</small></span></div>
  <h1>Questions de vérification du permis B</h1>
  <p>Les 100 fiches · Entraînement · Examen blanc</p>
</div>
<div class="compteur"><b>5</b><b>4</b><b>7</b><b class="cle">2</b><b class="cle">6</b></div>
<div class="bande"></div>
</body></html>`;

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });
await navigateur.close();
console.log('✓ public/og.png');
