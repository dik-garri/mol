# Молодёжка – Project Conventions

## Overview
Презентации для молодёжных групп на русском языке, размещённые на GitHub Pages.

## Structure
```
mol/
├── index.html                         # Landing page (GitHub Pages)
├── BACKLOG.md                         # Backlog of 20 topics with key points
├── presentations/
│   └── <slug>/                        # One folder per presentation
│       ├── index.html                 # Reveal.js presentation
│       ├── styles.css                 # Custom styles
│       ├── konspekt.md                # Study notes (конспект)
│       └── presentation.pdf           # PDF export (optional)
├── CLAUDE.md
└── README.md
```

## Creating Presentations
- Use the `revealjs` skill
- Each presentation goes in `presentations/<slug>/` with main file named `index.html`
- Slug: lowercase latin transliteration of the topic (e.g. `vera-i-strah`)
- Each presentation should have a `konspekt.md` with study notes
- After creating a new presentation, ALWAYS update ALL of the following:
  1. `index.html` – add a card to the landing page (ОБЯЗАТЕЛЬНО)
  2. `README.md` – add row to the presentations table
  3. `BACKLOG.md` – mark topic status as ✅ Готова
  4. `CLAUDE.md` – update structure if it changed

## Bible Quotes
- All scripture texts MUST be exact copies from the Synodal translation (Синодальный перевод)
- Verify quotes via bible.by or similar source before writing
- Never paraphrase or quote from memory

## Typography
- Use en dash `–` (среднее тире) everywhere, NOT em dash `–`
- In HTML use `&ndash;` entity

## Design Defaults
- Dark theme: background `#0F1B2D`
- Fonts: Montserrat (headings/body), Lora (scripture)
- Colors: gold `#D4A843`, fear-red `#C75B5B`, faith-green `#5BA88C`
- Language: Russian

## Deployment
- GitHub Pages serves from `main` branch root
- Site URL: https://dik-garri.github.io/mol/
