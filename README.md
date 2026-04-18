# Léo Demont — Portfolio

Portfolio personnel de Léo Demont, Motion Designer & 3D Artist basé à Paris.

## Structure

```
portfolio/
├── index.html                  # Home — grille des 14 projets
├── about.html                  # À propos
├── contact.html                # Contact + formulaire
├── work/                       # Pages projet individuelles
│   ├── apple.html
│   ├── windows.html
│   ├── burberry.html
│   ├── oakley.html
│   ├── guerlain.html
│   ├── vivienne-westwood-bag.html
│   ├── thermos.html
│   ├── truck.html
│   ├── prada.html
│   ├── booba.html
│   ├── vivienne-westwood-pearl.html
│   ├── kame-house.html
│   ├── capsule-corp.html
│   └── michou.html
├── css/
│   └── style.css
├── js/
│   ├── main.js                 # Cursor, scroll reveal, transitions, mobile nav
│   └── three-hero.js          # Three.js animation hero home
└── assets/
    └── reel.mp4               # (à remplacer)
```

## Personnalisation avant déploiement

1. Remplace `[MON EMAIL À REMPLACER]` dans `index.html`, `contact.html` par ton email réel
2. Ajoute `assets/reel.mp4` — ta vidéo showreel
3. Remplis les descriptions dans chaque page `work/*.html`
4. Remplace les images de galerie par les vraies visuels projet

## Deploy sur Cloudflare Pages

1. Push ce dossier sur GitHub (repo public ou privé)
2. Va sur [pages.cloudflare.com](https://pages.cloudflare.com) → **Create a project** → **Connect to Git**
3. Sélectionne le repo GitHub
4. Build settings :
   - Framework preset : **None**
   - Build command : *(laisser vide)*
   - Build output directory : `/`
5. **Save and Deploy**
6. Domaine custom : Settings → Custom Domains → ajouter `leodemont.fr`

## Stack

- HTML5 / CSS3 vanilla — zéro framework
- [Three.js r128](https://threejs.org/) — animation hero
- Google Fonts : Bebas Neue + DM Sans
- Prêt pour Cloudflare Pages (static, aucun build step)
