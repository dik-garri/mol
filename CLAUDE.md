# Молодёжка – Project Conventions

## Overview
Материалы для служения: презентации для молодёжных групп и конспекты проповедей для собрания. Размещены на GitHub Pages.

## Structure
```
mol/
├── index.html                         # Landing page (GitHub Pages)
├── BACKLOG.md                         # Backlog of youth group topics
├── SERMONS_BACKLOG.md                 # Backlog of sermon topics (teachings of Jesus)
├── presentations/
│   └── <slug>/                        # One folder per presentation
│       ├── index.html                 # Reveal.js presentation
│       ├── styles.css                 # Custom styles
│       ├── konspekt.md                # Study notes (конспект)
│       ├── presentation.pdf           # PDF export (optional)
│       └── anons.png                  # Social media announcement image (optional)
├── sermons/
│   └── <slug>.md                      # Sermon notes (конспекты проповедей)
├── luki/
│   └── Луки-<глава>_<стихи>.md       # Разборы Евангелия от Луки по отрывкам
├── templates/
│   └── anons-template.html            # HTML template for social media announcements
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

## Sermons (Конспекты проповедей)
- Конспекты проповедей для собрания хранятся в `sermons/`
- Каждый конспект – отдельный файл `<slug>.md` (транслитерация темы)
- Формат: заголовок, ключевые тексты, план проповеди, выводы
- Те же правила по цитатам из Библии и типографике

## Разборы Евангелия от Луки
- Последовательное изучение Евангелия от Луки по отрывкам
- Хранятся в `luki/`, каждый файл – один отрывок: `Луки-<глава>_<стихи>.md`
- Шаблон для новых разборов: `luki/TEMPLATE.md`
- Покрытие: Луки 1:5 – 6:49 (11 разборов)
- Структура каждого разбора:
  1. `# Заголовок` – ссылка на отрывок
  2. `Текст отрывка` – полный текст (Синодальный перевод) с номерами стихов (¹²³)
  3. `Контекст` – историко-литературный контекст (3–4 предложения)
  4. `Разделы` (## 1, 2, 3...) – разбор по блокам стихов:
     - Цитата стихов
     - Наблюдения (буллеты)
     - **Суть** / **Акцент** / **Мысль** – обязательные метки
     - 📖 **Параллели** – перекрёстные ссылки с цитатами и ➡ связью
     - Подтемы (###) – культурный, исторический, лингвистический контекст
  5. `Богословский итог` – ключевые выводы
  6. `Дополнительно` – углублённый материал (необязательно)
  7. `Практические выводы` – применение

## Bible Quotes
- All scripture texts MUST be exact copies from the Synodal translation (Синодальный перевод)
- Verify quotes via bible.by or similar source before writing
- Never paraphrase or quote from memory

## Typography
- Use en dash `–` (среднее тире) everywhere, NOT em dash `–`
- In HTML use `&ndash;` entity

## Создание анонса для соцсетей

Для каждой презентации можно создать картинку-анонс (`anons.png`) для публикации в Instagram/Telegram.

### Процесс
1. Скопировать шаблон `templates/anons-template.html` в папку презентации как `anons.html` и заменить: эмодзи, заголовок, цитату и ссылку на стих
2. Рендер в PNG через Chrome headless:
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu \
     --screenshot=anons.png --window-size=1080,1350 \
     anons.html
   ```
3. Обрезать по 10% с каждой стороны через `sips` (итог 864×1080):
   ```bash
   sips --cropToHeightWidth 1080 864 --cropOffset 135 108 anons.png
   ```
4. Удалить временный `anons.html` из папки презентации

### Шаблон анонса
- Фон: `#0F1B2D` (как в презентации)
- Декоративные полупрозрачные круги (`opacity: 0.07`) с цветами `#D4A843` и `#5B8CA8`
- Эмодзи-иконка по теме (120px)
- Заголовок темы – Montserrat 800, золотой `#D4A843` (110px)
- Градиентный разделитель (gold → teal)
- Ключевая цитата – Lora italic (38px)
- Ссылка на стих – Montserrat, `#7A8BA8` (26px)
- Всё по центру, `justify-content: center`

## Design Defaults
- Dark theme: background `#0F1B2D`
- Fonts: Montserrat (headings/body), Lora (scripture)
- Colors: gold `#D4A843`, fear-red `#C75B5B`, faith-green `#5BA88C`
- Language: Russian

## Deployment
- GitHub Pages serves from `main` branch root
- Site URL: https://dik-garri.github.io/mol/
