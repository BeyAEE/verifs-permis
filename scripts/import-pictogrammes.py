#!/usr/bin/env python3
"""Importe les pictogrammes (voyants, commandes) du PDF officiel des vérifications.

Dans la banque officielle (DSR, 1er janvier 2018), la réponse de certaines
vérifications intérieures n'est pas un texte mais une image : le voyant à
montrer. L'outil moniteur, extrait en texte, a donc une réponse vide pour ces
fiches. Ce script retrouve ces images et les rattache à leur fiche.

Repérage : la k-ième étiquette « VI » / « VE » du document est la fiche k
(ordre et parité vérifiés). Une image est rattachée à la fiche dont l'en-tête est
juste au-dessus, si elle est dans la colonne réponse de la ligne vérification.

Usage (PyMuPDF requis : `pip install pymupdf`) :
    python3 scripts/import-pictogrammes.py data/source/banque-verifications-2018.pdf

Produit public/pictogrammes/*.png et src/data/pictogrammes.json.
"""
import hashlib, json, os, sys
import fitz  # PyMuPDF

# Nom de fichier et texte alternatif de chaque pictogramme (décrits à la main ;
# le texte des fiches, lui, n'est jamais modifié).
DESCRIPTIONS = {
    "degivrage-lunette-arriere": "Pictogramme orange du dégivrage de la lunette arrière : un rectangle et trois flèches ondulées vers le haut",
    "pression-huile": "Voyant rouge de pression d’huile : une burette d’huile avec une goutte",
    "batterie": "Voyant rouge de charge de la batterie : une batterie avec les signes moins et plus",
    "freinage": "Voyant rouge du système de freinage : un point d’exclamation dans un cercle, entre deux parenthèses",
    "temperature-refroidissement": "Voyant rouge de température du liquide de refroidissement : un thermomètre au-dessus de vagues",
    "porte-ouverte": "Voyant rouge de portière ouverte : une voiture vue de dessus, portières ouvertes",
    "regulateur-vitesse": "Pictogramme du régulateur de vitesse : un compteur de vitesse avec une flèche",
    "airbag-passager": "Étiquette de l’airbag passager : position OFF avec siège enfant dos à la route autorisé, position ON avec siège enfant dos à la route interdit",
    "ceinture": "Voyant rouge de ceinture non bouclée : un personnage assis avec sa ceinture de sécurité",
    "brouillard-arriere": "Voyant orange du feu de brouillard arrière : un demi-cercle et des traits horizontaux traversés d’une ligne",
    "feux-de-route": "Voyant bleu des feux de route : un phare avec des traits horizontaux",
    "limiteur-vitesse": "Pictogramme du limiteur de vitesse : un compteur avec une flèche et un repère de limite",
}
FICHES = {
    13: "degivrage-lunette-arriere", 73: "degivrage-lunette-arriere",
    15: "pression-huile", 75: "pression-huile",
    23: "batterie",
    25: "freinage", 55: "freinage", 81: "freinage",
    27: "temperature-refroidissement", 83: "temperature-refroidissement",
    29: "porte-ouverte",
    33: "regulateur-vitesse",
    37: "airbag-passager", 87: "airbag-passager",
    39: "ceinture", 89: "ceinture",
    43: "brouillard-arriere", 47: "brouillard-arriere", 91: "brouillard-arriere",
    51: "feux-de-route", 95: "feux-de-route",
    57: "limiteur-vitesse",
}

chemin_pdf = sys.argv[1]
pdf = fitz.open(chemin_pdf)

entetes, lignes = [], []
for no, page in enumerate(pdf):
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                t = s["text"].strip()
                if t in ("VI", "VE"):
                    entetes.append((no, s["bbox"][1], t))
                elif t in ("QSER", "1ers secours"):
                    lignes.append((no, s["bbox"][1]))
assert len(entetes) == 100, f"{len(entetes)} en-têtes trouvés au lieu de 100"
for k, (_, _, t) in enumerate(entetes, start=1):
    assert t == ("VI" if k % 2 else "VE"), f"fiche {k} : en-tête {t} inattendu"

def fiche_de(no, y):
    return max([i for i, (p, yy, _) in enumerate(entetes, start=1) if (p, yy) <= (no, y)], default=0)

def dans_verification(no, y, k):
    p0, y0, _ = entetes[k - 1]
    return not any((p0, y0) < (p, yy) <= (no, y) for p, yy in lignes)

os.makedirs("public/pictogrammes", exist_ok=True)
trouves = {}  # fiche → (nom, page, xref)
for no, page in enumerate(pdf):
    for info in page.get_image_info(xrefs=True):
        x0, y0, x1, y1 = info["bbox"]
        k = fiche_de(no, y0)
        if k == 0 or (x0 + x1) / 2 < page.rect.width * 0.53 or not dans_verification(no, y0, k):
            continue
        if k not in FICHES:
            raise SystemExit(f"Image inattendue pour la fiche {k} (page {no + 1}) : ajoute-la à FICHES")
        trouves[k] = (FICHES[k], no + 1, info["xref"])

manquantes = set(FICHES) - set(trouves)
if manquantes:
    raise SystemExit(f"Pictogrammes attendus mais introuvables : {sorted(manquantes)}")

# Une image par nom ; si deux fiches d'un même nom ont des images différentes
# dans le PDF, la seconde reçoit un suffixe (aucune image n'est remplacée par une autre).
fichiers, par_xref = {}, {}
for k in sorted(trouves):
    nom, page_no, xref = trouves[k]
    if xref not in par_xref:
        fichier = f"{nom}.png" if f"{nom}.png" not in fichiers.values() else f"{nom}-{k}.png"
        pix = fitz.Pixmap(pdf, xref)
        smask = pdf.extract_image(xref).get("smask")
        if smask:
            pix = fitz.Pixmap(pix, fitz.Pixmap(pdf, smask))
        if pix.n - pix.alpha >= 4:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        pix.save(os.path.join("public/pictogrammes", fichier))
        par_xref[xref] = fichier
    fichiers[k] = par_xref[xref]

empreinte = hashlib.sha256(open(chemin_pdf, "rb").read()).hexdigest()
donnees = {
    "schema": "verifs-permis/pictogrammes@1",
    "source": {
        "document": "Banque des vérifications techniques, questions de sécurité routière et de premiers secours — DSR, 1er janvier 2018",
        "fichier": os.path.basename(chemin_pdf),
        "sha256": empreinte,
    },
    "pictogrammes": [
        {"fiche": k, "fichier": fichiers[k], "alt": DESCRIPTIONS[trouves[k][0]], "page": trouves[k][1]} for k in sorted(fichiers)
    ],
}
with open("src/data/pictogrammes.json", "w", encoding="utf-8") as f:
    json.dump(donnees, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"✓ {len(fichiers)} fiches, {len(par_xref)} images → public/pictogrammes/")
