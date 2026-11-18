# Charte graphique ECF 2026 : règles pour le site

Résumé de la charte du groupe ECF (identité Groupe & Auto-école), pour toute
modification future du site **Vérifs permis B**. Source officielle :
https://www.ecf.asso.fr/charte-graphique-groupe-ecf

Claude : applique ces règles à chaque modification visuelle du site.

---

## 1. Couleurs

| Rôle | Nom | HEX |
|---|---|---|
| Accent unique (boutons, titres clés, en-tête) | Bleu ECF | `#124483` |
| Secondaire, en touche | Rouge ECF | `#DA1F26` |
| Fond | Blanc | `#FFFFFF` |
| Déclinaison claire | Bleu ECF dégradé 1 | `#98C0F1` |
| Déclinaison claire (bordures, séparateurs) | Bleu ECF dégradé 2 | `#C0D9F6` |
| Déclinaison claire (fonds de page et de blocs) | Bleu ECF dégradé 3 | `#E9F1FC` |
| Déclinaison claire du rouge | Rouge ECF dégradé 1 / 2 / 3 | `#F0989B` / `#F6C1C2` / `#FCE9E9` |

Pour une interface (site, application), deux couleurs de texte s'ajoutent :

- `#191C21` pour le texte principal (jamais de noir pur) ;
- `#5C626C` pour le texte secondaire (jamais plus clair).

**Règles :**

- Un seul accent : le Bleu ECF. Le rouge reste une touche (badge, étiquette,
  alerte, erreur). Il n'est jamais utilisé en fond de grande surface.
- Les « dégradés » de la charte sont des teintes claires en aplat, **jamais
  des dégradés de couleur** (pas de `linear-gradient`).
- Pas de gris : fonds et bordures viennent des bleus clairs ci-dessus.
- Pas de transparence pour fabriquer une teinte (`rgba`, `opacity`).
- Ni ombre, ni lueur, ni violet.
- Contrastes :
  - Bleu ECF sur blanc : 9,6:1, convient pour le texte ;
  - Rouge ECF sur blanc : 4,9:1, réservé aux textes courts ;
  - **jamais de texte rouge sur bleu.**
- Couleurs sémantiques (succès, avertissement) : en teintes désaturées.
  L'erreur peut reprendre le Rouge ECF. Sur le site, le succès utilise
  `#2F6B4F` (texte, boutons), `#3C8A62` (zones sur photo) et `#E6F0EA` (fond).
- La charte ne prévoit pas de mode sombre.

## 2. Typographie

- Police unique : **Affogato** (fichiers du site dans `src/fonts/`). Graisses
  disponibles : Light 300, Regular 400, Medium 500, Bold 700, Black 900.
- **Trois graisses au maximum par support.** Pour une interface : Regular 400,
  Medium 500, Bold 700, sans Black. C'est ce que le site utilise.
- Espacement des lettres naturel, jamais négatif.
- Pile de repli sur le web :
  `"Affogato", "Aptos", -apple-system, "Segoe UI", system-ui, sans-serif`.
- Affogato ne contient pas les espaces insécables (U+00A0, U+202F, U+2009).
  Sur une page web, l'effet est invisible. Dans un PDF, il faut les éviter.

## 3. Logo

Fichiers d’origine fournis par ECF dans `docs/logos-ecf/` (SVG à privilégier sur le web) ; sur le site, les versions recadrées sont dans `public/` :

| Fichier | Quand l'utiliser |
|---|---|
| `ecf-gp-classique.svg` / `.png` | Sur un fond blanc ou clair uni |
| `ecf-gp-contour.svg` / `.png` | Sur un fond bleu, coloré ou une photo. **Obligatoire sur fond coloré.** C'est la version utilisée dans l'en-tête du site. |
| `ecf-gp-blanc.svg` | Seulement sur demande |

Les SVG ont une grande marge transparente (cadre de 1 000 × 1 000). Pour
recadrer sur la boîte du logo :

- classique : `viewBox="0 327 1000 346"` ;
- contour : `viewBox="93 336 814 328"`.

Sur le site, les versions recadrées sont `public/logo-ecf.svg` et
`public/logo-ecf-contour.svg`.

**Règles officielles :**

- Le logo est **immuable** : les lettres « ecf » et les ailes bleue et rouge
  sont indissociables.
- Largeur minimum : **80 px à l'écran** (environ 96 px conseillés), 25 mm en
  impression.
- **Zone de protection** autour du logo, égale à la hauteur de l'aile (environ
  0,115 × la largeur du logo) : aucun texte, bord ni élément dedans.
- **Interdit :**
  - étirer, pivoter ou changer les couleurs du logo ;
  - lui ajouter une ombre, un contour ou un dégradé ;
  - le recréer en texte ;
  - le poser dans une pastille ou un disque blanc sur un fond bleu ;
  - le placer à cheval sur deux fonds.
- Ne pas utiliser les anciens logos (bulle haute, bulle basse, logo
  personnalisé « PICCO »).

## 4. Ton

- **Tutoiement** partout. C'est déjà le cas sur le site.
- Visuel sobre : blanc dominant, Bleu ECF en fil conducteur, rouge en touche,
  photos réelles plutôt qu'illustrations, pas d'emoji.

## 5. Contrôle automatique sur le site

Le test `tests/unit/contrastes.test.ts` vérifie :

- les contrastes WCAG AA des couleurs du thème ;
- qu'aucune couleur hors de cette charte n'est déclarée dans les variables
  `:root` de `src/styles/global.css`.

Toute nouvelle couleur doit donc venir de la liste ci-dessus.
