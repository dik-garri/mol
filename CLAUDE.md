# Молодёжка – Project Conventions

## Overview
Материалы для служения: презентации для молодёжных групп и конспекты проповедей для собрания. Размещены на GitHub Pages.

## Процесс подготовки темы (ОБЯЗАТЕЛЬНО)

### Шаг 0. Напомнить помолиться

**ПЕРЕД ЛЮБОЙ ПОДГОТОВКОЙ** (презентация, проповедь, разбор) – Claude ОБЯЗАН:
1. Напомнить пользователю помолиться перед началом работы
2. **ОСТАНОВИТЬСЯ и ждать**, пока пользователь явно не скажет, что помолился
3. НЕ задавать вопросы по теме, не собирать цитаты, не писать – НИЧЕГО, пока пользователь не подтвердил молитву
4. Только после подтверждения – переходить к шагу «вопросы»

Это не формальность. Материал готовится для служения Богу и людям – начинаем с Того, ради Кого работаем.

### Шаг 1. Вопросы (только после молитвы)

**Главный принцип: направление выбирает пользователь, не Claude.**
Задача Claude – задавать вопросы так, чтобы пользователь рулил, а не просто одобрял чужие решения.

Перед тем как начать делать **любую** презентацию, проповедь или разбор, ВСЕГДА начинать с вопросов.

- **Минимум 5 вопросов** пользователю (лучше 7–10)
- Вопросы задавать **по одному за раз** – не списком
- Формат: multiple choice (A/B/C/D) там где возможно, открытые – только если выбор не очевиден
- Вопросы должны покрывать: акцент темы, аудиторию, тон, структуру, hook, ключевую цитату, главный вывод, практическое применение, возможные иллюстрации
- НЕ предлагать «давай я сам накидаю структуру, а ты поправишь» – это ставит пользователя в роль корректора, а не автора
- НЕ начинать писать содержимое, пока пользователь не ответил на все вопросы и не подтвердил направление
- Только после этого – собрать цитаты из `data/synodal.json`, показать пользователю на проверку, и приступать к созданию

Цель: пользователь формирует смысл и направление. Claude – помогает это оформить, а не подменяет авторство.

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
├── archive/
│   └── <slug>.md                      # Прочие материалы (исследования, doc-разборы) – вкладка «Архив»
├── materials/                         # Web-интерфейс для проповедей + Луки (список + читалка)
│   ├── index.html                     # SPA: список с фильтром / читалка markdown
│   ├── styles.css                     # Тёмная/светлая темы через CSS-переменные
│   ├── app.js                         # Hash-routing, поиск, фильтр по тегам, theme toggle
│   ├── build.py                       # Сборщик data.json из frontmatter .md-файлов
│   └── data.json                      # Индекс материалов (генерируется build.py)
├── pesni/                             # Songs for projector display (presenter + projector windows)
│   ├── index.html                     # SPA: list + song viewer + settings modal + projector popup
│   ├── styles.css                     # Themable via CSS vars (6 presets + overrides), presenter 3-column layout
│   ├── app.js                         # Routing, search, navigation, style presets, BroadcastChannel sync
│   ├── import.py                      # Importer from sbornik.sbena.net (run manually)
│   ├── data/songs.json                # All songs from "Молодёжный" album mol_FVZflEV (canonical)
│   └── data/songs.js                  # Same data as `window.SONGS_DATA` (для работы через file://)
├── uchenichestvo/
│   └── index.html                     # Редирект на https://dik-garri.github.io/uchenichestvo/
├── data/
│   └── synodal.json                   # Синодальный перевод (из church.kg) – 66 книг
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
- Те же правила по цитатам из Библии и типографике
- После создания обновить `README.md` – добавить строку в таблицу «Проповеди»
- После создания/правки тегов запустить `python3 materials/build.py` – пересобрать индекс для веб-интерфейса
- **Frontmatter (YAML) в начале файла** – используется веб-интерфейсом `materials/`:
  ```yaml
  ---
  title: "Лицемерие и религиозность"
  date: "2026-05"
  tags: ["Лк. 18", "Мф. 23", "фарисеи", "лицемерие"]
  ---
  ```
  Дата – месяц проведения (`YYYY-MM`). Теги (3–8 штук) – ключевые тексты + темы. Если frontmatter отсутствует, `build.py` добавит его из `DEFAULTS` (для новых файлов добавлять вручную или дополнить `DEFAULTS`).

### Формат конспекта
Конспект – это **план для выступления**, а не расписанный текст. Формат:
- Буллеты (поинты) с коротким пояснением, о чём говорить
- Под каждым поинтом, где есть ссылка на Библию – **полный текст цитаты** в блоке `>`
- После цитаты – краткое пояснение (1–2 строки), что подчеркнуть

### Структура файла
```
# Тема – план проповеди
*Подзаголовок / повод (если есть)*

## Введение
- Зацепка: история, картина, вопрос – чтобы захватить внимание
- Прочитать ключевой текст (полная цитата)
- Обозначить парадокс / проблему / тему

## 1–N. Разделы по смыслу
- Поинт → пояснение
  > Полная цитата из Библии – Ссылка
  - Что подчеркнуть, на что обратить внимание
- Подразделы (###) при необходимости

## Практика (если есть)
- Конкретные примеры: в церкви, дома, на работе/учёбе, в повседневной жизни
- Не абстрактно, а «как это выглядит в понедельник утром»

## Заключение
- 2–3 ключевых вывода (нумерованный список)
- Каждый вывод – 1–2 предложения

## Молитва
- Буллеты: благодарность → покаяние → просьба
```

### Процесс подготовки
1. Обсудить с пользователем выбор темы (предложить варианты)
2. Согласовать направление и главный вывод
3. Собрать точные тексты из `data/synodal.json` (НЕ по памяти)
4. Написать конспект в формате плана
5. Итерировать по обратной связи

## Разборы Евангелия от Луки
- Последовательное изучение Евангелия от Луки по отрывкам
- Хранятся в `luki/`, каждый файл – один отрывок: `Луки-<глава>_<стихи>.md`
- В начале файла – YAML-frontmatter с `title`, `subtitle`, `date`, `tags` (см. раздел «Sermons»)
- После создания/правки – запустить `python3 materials/build.py`
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

## Материалы (веб-интерфейс для проповедей и Луки)

Статический SPA в `materials/` – один файл `index.html` с двумя вкладками: «Проповеди» / «Луки». Без бэкенда, vanilla JS, hash-routing.

### Данные
- Источник правды – YAML-frontmatter в `.md` файлах `sermons/` и `luki/`
- `python3 materials/build.py` сканирует все файлы, парсит frontmatter, генерирует `materials/data.json`
- Если frontmatter отсутствует, скрипт добавляет его из словаря `DEFAULTS` в `build.py`
- Запускать после: добавления нового .md, изменения тегов/даты/title

### UI
- **Роутинг**: `materials/` = список, `materials/#/sermon/<slug>` или `materials/#/luki/<slug>` = читалка
- **Вкладки** «Проповеди» / «Луки» / «Архив» (счётчик у каждой). «Архив» – сборная папка `archive/` для материалов, не попадающих в первые две (исследования, doc-разборы и т.п.)
- **Поиск** – live-фильтр по `title`, `subtitle` и `tags`. Игнорирует `ё↔е` и регистр
- **Теги** – клик по тегу карточки добавляет фильтр (можно несколько одновременно). Активные теги показаны над списком, клик убирает
- **Читалка** – `marked.js` рендерит markdown (заголовки, цитаты, списки, таблицы). Frontmatter скрыт. Теги материала кликабельны – возвращают в список с фильтром
- **Темы**: тёмная (по умолчанию) и светлая. Переключатель fixed в правом верхнем углу. Сохранение в `localStorage` (`materials-theme`). Начальная определяется по `prefers-color-scheme`, чтобы не было flash – inline-скрипт в `<head>` ставит `data-theme` до загрузки CSS
- **Палитра**: те же CSS-переменные, что и в презентациях (gold `#D4A843` / teal `#5B8CA8` / dark blue `#0F1B2D`). Для светлой темы – overrides через `:root[data-theme="light"]`

## Ученичество
- Вынесено в отдельный проект: https://github.com/dik-garri/uchenichestvo
- В `uchenichestvo/index.html` – редирект на https://dik-garri.github.io/uchenichestvo/

## Песни (молодёжный сборник)

Статический SPA в `pesni/` – без бэкенда, vanilla JS, всё хранится в JSON и в `localStorage`.

### Источник данных
- Альбом «Молодёжный» на https://sbornik.sbena.net/album/mol_FVZflEV/<номер>
- Импортёр `pesni/import.py` (Python 3, без зависимостей): `python3 pesni/import.py`
  - Идёт по номерам с 1 до 30 пустых ответов подряд → стоп
  - Логика парсинга `{chord}` маркеров и блоков verse/repeat/part – портирована из `band/src/lib/sbornikImporter.ts`
  - Результат: `pesni/data/songs.json` (~1 МБ, 300 песен) **и** `pesni/data/songs.js` (`window.SONGS_DATA = [...]` – нужно для `file://`, т.к. fetch оттуда заблокирован). Оба файла коммитим.

### UI
- **Роутинг**: `#N` = песня №N, `` = список, `?projector=1` = окно проектора.
- **Список** (`#list-view`): поиск по номеру/названию/тексту (игнорирует `ё↔е`). Список скроллится внутри страницы (`.view { height: 100vh; overflow: hidden }`, `.songs-list { flex: 1; overflow-y: auto }`) – страница по высоте не растягивается.
- **Режим песни** (`#song-view`): одна шапка (header + nav в одной линии). Стрелки клавиатуры / пробел / PageUp / PageDown – листать блоки.
- **Шрифт песни**: кнопки `+`/`-` в шапке (ещё клавиши `+`/`-` в режиме песни). Диапазон 14–160 px, шаг 4 px, сохраняется в `localStorage` (`pesni-font-size`). Auto-fit был удалён – пользователь сам выставляет размер под свой экран.
- **Аккорды**: кнопка-переключатель в шапке. `.line` использует `--font-body` (пресетный), `.chord-line` – всегда моно `Menlo` (чтобы хоть как-то выравнивалось).

### Настройки стиля (модалка, открывается шестерёнкой в обеих шапках)
Хранится в `localStorage` как `pesni-style = { preset: string, overrides: { font?, bg?, text?, accent?, chord? } }`.

- **6 пресетов** (объект `PRESETS` в `app.js`): classic-dark, classic-light, projector (чёрный+жёлтый), sepia, mono, night. Каждый задаёт 4 цвета + шрифт.
- **Тонкая подстройка** поверх пресета: dropdown шрифта (Montserrat / Lora / Inter / Playfair Display / Menlo) + 4 color inputs (bg, text, accent, chord). Overrides сбрасываются при смене пресета или кнопкой «Сбросить к пресету».
- **Применение**: `applyStyle()` ставит CSS-переменные на `document.documentElement.style`. `--text-muted`/`--line`/`--bg-elevated` derived из фона (isDarkBg) и из текста через `hexToRgba(text, 0.55)`.
- **Миграция**: старый ключ `pesni-theme = 'light'/'dark'` автоматически превращается в `classic-light`/`classic-dark` при первом запуске после обновления.

### Режим докладчика (проектор)
Кнопка `📺` в шапке – toggle: открывает/закрывает отдельное popup-окно проектора (тот же `index.html?projector=1`).

- **Окно проектора**: `body.projector-mode` – скрыты все chrome-элементы, показан только `.block-label` + `.block-content`, центрирован на полный экран. Клавиши: `F` – fullscreen, `←`/`→`/`Space` – отправляют `nav` обратно на presenter через BroadcastChannel.
- **Presenter 3-колоночная раскладка** (`body.presenter-active`, активно когда проектор открыт): **25% поиск+список песен | 50% текущий блок | 25% превью блоков (как в PowerPoint)**. Правая колонка – карточки с меткой + первые 6 строк + scroll-into-view активной карточки. При <900px viewport раскладка схлопывается в 1 колонку.
- **Синхронизация через `BroadcastChannel('pesni-projector')`**:
  - Presenter → Projector: `{type:'state', song, block, chords, style, fontSize}` (полный дамп), `{type:'song'|'block'|'chords'|'style'|'fontSize', ...}` (инкременты).
  - Projector → Presenter: `{type:'ready'}` (на старте + в ответ на `hello`), `{type:'nav', dir:'next'|'prev'}`, `{type:'closed'}` (в beforeunload).
  - Рукопожатие: presenter на старте шлёт `{type:'hello'}` (чтобы projector, открытый раньше, переотослал `ready` и получил state).
- **Флаг `pesni-projector-open`** в localStorage – чтобы индикатор восстанавливался после перезагрузки presenter. Heartbeat 2с проверяет `state.projectorWindow.closed` для case'ов force-close.
- **Hint для подсказки про блок дальше**: `· Далее: Припев` рядом со счётчиком – видно только когда проектор открыт.
- **Popup-blocker**: при `window.open === null` показываем alert.

## Bible Quotes
- All scripture texts MUST be exact copies from the Synodal translation (Синодальный перевод)
- **Primary source:** `data/synodal.json` – локальная копия Синодального перевода из проекта church.kg
  - Структура: массив из 66 книг, каждая `{ "abbrev": "lk", "chapters": [[стих1, стих2, ...], ...] }`
  - Индексы: книги с 0, главы с 0, стихи с 0
  - Луки = индекс 41 (`lk`), глава 8 = `chapters[7]`, стих 15 = `[14]`
  - Пример: `data["lk"].chapters[7][14]` → Луки 8:15
- НЕ использовать WebFetch для получения текстов Библии – он обрезает текст
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
