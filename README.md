# Молодёжка

Презентации для молодёжных групп.

## Просмотр

**GitHub Pages:** https://dik-garri.github.io/mol/

Или откройте любой `index.html` локально в браузере.

## Презентации

| Тема | Ссылка |
|------|--------|
| Вера и страх | [presentations/vera-i-strah/](presentations/vera-i-strah/) |
| Настоящая дружба | [presentations/nastoyashchaya-druzhba/](presentations/nastoyashchaya-druzhba/) |
| Кто я во Христе | [presentations/kto-ya-vo-khriste/](presentations/kto-ya-vo-khriste/) |
| Сомнения – не грех | [presentations/somneniya-ne-grekh/](presentations/somneniya-ne-grekh/) |
| Он жив – и я живой (Пасха) | [presentations/on-zhiv-i-ya-zhivoy/](presentations/on-zhiv-i-ya-zhivoy/) |
| Молитва без фильтров | [presentations/molitva-bez-filtrov/](presentations/molitva-bez-filtrov/) |
| Где Бог, когда больно? | [presentations/gde-bog-kogda-bolno/](presentations/gde-bog-kogda-bolno/) |
| Как читать Библию | [presentations/kak-chitat-bibliyu/](presentations/kak-chitat-bibliyu/) |
| Я и соцсети | [presentations/ya-i-socseti/](presentations/ya-i-socseti/) |
| Конфликты и прощение | [presentations/konflikty-i-proshchenie/](presentations/konflikty-i-proshchenie/) |
| Когда все делают «это» | [presentations/kogda-vse-delayut-eto/](presentations/kogda-vse-delayut-eto/) |
| Технологии и служение | [presentations/tehnologii-i-sluzhenie/](presentations/tehnologii-i-sluzhenie/) |

## Проповеди

| Тема | Ссылка |
|------|--------|
| Положил в сердце (Даниил 1) | [sermons/polozhil-v-serdce.md](sermons/polozhil-v-serdce.md) |
| Царство Божие | [sermons/tsarstvo-bozhie.md](sermons/tsarstvo-bozhie.md) |
| Лицемерие и религиозность | [sermons/litsemerie-i-religioznost.md](sermons/litsemerie-i-religioznost.md) |
| Любовь – наибольшая заповедь | [sermons/lyubov-naibolshaya-zapoved.md](sermons/lyubov-naibolshaya-zapoved.md) |
| Царь на осле (Вербное воскресенье) | [sermons/tsar-na-osle.md](sermons/tsar-na-osle.md) |
| Страстная пятница | [sermons/strastnaya-pyatnitsa.md](sermons/strastnaya-pyatnitsa.md) |
| Перед крещением | [sermons/pered-kreshcheniem.md](sermons/pered-kreshcheniem.md) |
| Крещение Христово 2026 | [sermons/kreshchenie-khristovo-2026.md](sermons/kreshchenie-khristovo-2026.md) |
| Новый год | [sermons/novyy-god.md](sermons/novyy-god.md) |
| Похороны | [sermons/pokhorony.md](sermons/pokhorony.md) |
| Самарянка | [sermons/samaryanka.md](sermons/samaryanka.md) |

## Материалы (веб-интерфейс)

Статический SPA в `materials/` – список проповедей и разборов Луки с поиском, фильтром по тегам, тёмной/светлой темой и читалкой markdown.

- **Открыть**: https://dik-garri.github.io/mol/materials/
- **Источник данных**: YAML-frontmatter в `sermons/*.md` и `luki/Луки-*.md`
- **Пересобрать индекс** (после добавления/правки тегов): `python3 materials/build.py`

## Песни

Молодёжный сборник для проектора – `pesni/` (импортирован из [sbornik.sbena.net](https://sbornik.sbena.net/album/mol_FVZflEV/1)).

- **Поиск** по номеру / названию / тексту
- **Просмотр куплет за куплетом**: стрелки `←` / `→` / пробел / кнопки в шапке
- **Аккорды**: показать/скрыть
- **Шрифт**: `+` / `-` в шапке (запоминается)
- **Стили**: 6 пресетов (Классика тёмная/светлая, Проектор контраст, Сепия, Монохром, Ночной минимализм) + тонкая подстройка (шрифт + 4 цвета)
- **Режим докладчика** (кнопка 📺 в шапке): открывает отдельное окно проектора. На ноутбуке – 3 колонки (список песен / текущий блок / превью блоков как в PowerPoint), на проекторе – только текст. Синхронизация через `BroadcastChannel`, клавиши `F` для fullscreen, стрелки листают в любом окне.
- Обновить песни: `python3 pesni/import.py` → коммит `data/songs.json` и `data/songs.js`

## Ученичество

Вынесено в отдельный проект: [dik-garri/uchenichestvo](https://github.com/dik-garri/uchenichestvo)
