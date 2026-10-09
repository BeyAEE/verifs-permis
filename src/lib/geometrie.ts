// Coordonnées des zones : pourcentages de l'image (0–100), indépendants de
// l'écran. La visionneuse applique « translate(tx, ty) scale(s) » avec
// transform-origin 0 0 sur un calque de la taille de base de l'image.

export type Point = [number, number];

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Transformation {
  s: number;
  tx: number;
  ty: number;
}

/** Lancer de rayon ; un point sur le bord compte comme dedans. */
export function pointDansPolygone([x, y]: Point, polygone: Point[]): boolean {
  if (polygone.length < 3) return false;
  let dedans = false;
  for (let i = 0, j = polygone.length - 1; i < polygone.length; j = i++) {
    const [xi, yi] = polygone[i];
    const [xj, yj] = polygone[j];
    if (surSegment([x, y], [xi, yi], [xj, yj])) return true;
    const coupe = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (coupe) dedans = !dedans;
  }
  return dedans;
}

function surSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): boolean {
  const produit = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  if (Math.abs(produit) > 1e-9) return false;
  return px >= Math.min(ax, bx) - 1e-9 && px <= Math.max(ax, bx) + 1e-9 && py >= Math.min(ay, by) - 1e-9 && py <= Math.max(ay, by) + 1e-9;
}

/** Rectangle à l'écran de l'image après transformation. */
export function rectTransforme(base: Rect, t: Transformation): Rect {
  return { left: base.left + t.tx, top: base.top + t.ty, width: base.width * t.s, height: base.height * t.s };
}

/** Point écran (clientX, clientY) → point relatif en % de l'image. */
export function ecranVersRelatif(clientX: number, clientY: number, rectImage: Rect): Point {
  return [((clientX - rectImage.left) / rectImage.width) * 100, ((clientY - rectImage.top) / rectImage.height) * 100];
}

/** Point relatif en % → coordonnées écran. */
export function relatifVersEcran([x, y]: Point, rectImage: Rect): [number, number] {
  return [rectImage.left + (x / 100) * rectImage.width, rectImage.top + (y / 100) * rectImage.height];
}

export function dansImage([x, y]: Point): boolean {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 6;

/** Empêche de sortir l'image du cadre : à s = 1 elle remplit exactement le cadre. */
export function borner(t: Transformation, largeur: number, hauteur: number): Transformation {
  const s = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, t.s));
  const tx = Math.min(0, Math.max(largeur - largeur * s, t.tx));
  const ty = Math.min(0, Math.max(hauteur - hauteur * s, t.ty));
  return { s, tx, ty };
}

/** Zoom en gardant fixe le point (cx, cy), exprimé en px dans le cadre. */
export function zoomerAutour(t: Transformation, facteur: number, cx: number, cy: number, largeur: number, hauteur: number): Transformation {
  const s = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, t.s * facteur));
  const k = s / t.s;
  return borner({ s, tx: cx - (cx - t.tx) * k, ty: cy - (cy - t.ty) * k }, largeur, hauteur);
}

/** Centre géométrique d'un polygone (pour cadrer la zone). */
export function centre(polygone: Point[]): Point {
  const n = polygone.length || 1;
  return [polygone.reduce((a, p) => a + p[0], 0) / n, polygone.reduce((a, p) => a + p[1], 0) / n];
}
