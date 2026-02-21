# Молодёжка — Project Conventions

## Overview
Презентации для молодёжных групп на русском языке, размещённые на GitHub Pages.

## Structure
```
mol/
├── index.html                         # Landing page (GitHub Pages)
├── presentations/
│   └── <slug>/                        # One folder per presentation
│       ├── index.html                 # Reveal.js presentation
│       ├── styles.css                 # Custom styles
│       └── presentation.pdf           # PDF export (optional)
├── CLAUDE.md
└── README.md
```

## Creating Presentations
- Use the `revealjs` skill
- Each presentation goes in `presentations/<slug>/` with main file named `index.html`
- Slug: lowercase latin transliteration of the topic (e.g. `vera-i-strah`)
- After creating a new presentation, add a card to the root `index.html`

## Design Defaults
- Dark theme: background `#0F1B2D`
- Fonts: Montserrat (headings/body), Lora (scripture)
- Colors: gold `#D4A843`, fear-red `#C75B5B`, faith-green `#5BA88C`
- Language: Russian

## Deployment
- GitHub Pages serves from `main` branch root
- Site URL: https://dik-garri.github.io/mol/
