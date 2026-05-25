#!/usr/bin/env python3
"""Сборщик индекса материалов (проповеди + Луки).

Сканирует sermons/*.md и luki/Луки-*.md, парсит YAML-frontmatter и пишет
materials/data.json для веб-интерфейса.

Если в файле нет frontmatter, добавляет его на основе DEFAULTS (используется
при первом запуске или для новых файлов, у которых ещё нет метаданных).
После генерации frontmatter правки делаются вручную в самих .md файлах.

Запуск: python3 materials/build.py
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERMONS_DIR = ROOT / "sermons"
LUKI_DIR = ROOT / "luki"
DRAFT_DIR = ROOT / "draft"
ARCHIVE_DIR = ROOT / "archive"
OUT_FILE = ROOT / "materials" / "data.json"

# Defaults for existing files (used to seed frontmatter on first run).
# Format: filename -> {"title": ..., "date": "YYYY-MM", "tags": [...]}
DEFAULTS: dict[str, dict] = {
    # --- sermons ---
    "klyatva-kotoraya-stoila-zhizni.md": {
        "title": "Клятва, которая стоила жизни",
        "date": "2026-04",
        "tags": ["Страстная пятница", "Иоанн Креститель", "Ирод", "клятва", "верность", "крест"],
    },
    "litsemerie-i-religioznost.md": {
        "title": "Лицемерие и религиозность",
        "date": "2026-05",
        "tags": ["Лк. 18", "Мф. 23", "фарисеи", "лицемерие", "сердце", "мытарь"],
    },
    "lyubov-naibolshaya-zapoved.md": {
        "title": "Любовь – наибольшая заповедь",
        "date": "2026-04",
        "tags": ["Мф. 22", "любовь", "заповедь", "ближний"],
    },
    "pered-kresheniem.md": {
        "title": "Перед крещением",
        "date": "2026-04",
        "tags": ["крещение", "Деян. 2", "покаяние", "прощение"],
    },
    "tsar-na-osle.md": {
        "title": "Царь на осле",
        "date": "2026-04",
        "tags": ["Вербное воскресенье", "Зах. 9", "Мф. 21", "царь", "смирение"],
    },
    "tsarstvo-bozhie.md": {
        "title": "Царство Божие",
        "date": "2026-03",
        "tags": ["Царство Божие", "Мк. 1", "Мф. 13", "новое рождение", "ученики"],
    },
    # --- luki ---
    "Луки-1_5-25.md": {
        "title": "Луки 1:5–25",
        "subtitle": "Захария и Елисавета – благовестие об Иоанне",
        "date": "2026-05",
        "tags": ["Лк. 1", "Захария", "Елисавета", "Иоанн Креститель", "ангел Гавриил", "молитва"],
    },
    "Луки-1_26-38.md": {
        "title": "Луки 1:26–38",
        "subtitle": "Благовестие Марии",
        "date": "2026-05",
        "tags": ["Лк. 1", "Мария", "Гавриил", "благовестие", "девство", "вера"],
    },
    "Луки-2_1-7.md": {
        "title": "Луки 2:1–7",
        "subtitle": "Рождение Иисуса в Вифлееме",
        "date": "2026-05",
        "tags": ["Лк. 2", "Рождество", "Вифлеем", "перепись", "ясли", "Иосиф"],
    },
    "Луки-2_21-35.md": {
        "title": "Луки 2:21–35",
        "subtitle": "Симеон и Анна в храме",
        "date": "2026-05",
        "tags": ["Лк. 2", "Симеон", "Анна", "храм", "обрезание", "пророчество"],
    },
    "Луки-2_41-52.md": {
        "title": "Луки 2:41–52",
        "subtitle": "Отрок Иисус в храме",
        "date": "2026-05",
        "tags": ["Лк. 2", "отрок Иисус", "храм", "Пасха", "учители", "Отец"],
    },
    "Луки-3_15-38.md": {
        "title": "Луки 3:15–38",
        "subtitle": "Крещение Иисуса и родословие",
        "date": "2026-05",
        "tags": ["Лк. 3", "Иоанн Креститель", "крещение", "Дух Святой", "родословие"],
    },
    "Луки-4_14-30.md": {
        "title": "Луки 4:14–30",
        "subtitle": "Служение в Назарете – отвержение",
        "date": "2026-05",
        "tags": ["Лк. 4", "Назарет", "Ис. 61", "помазание", "отвержение", "синагога"],
    },
    "Луки-5_1-11.md": {
        "title": "Луки 5:1–11",
        "subtitle": "Призвание первых учеников",
        "date": "2026-05",
        "tags": ["Лк. 5", "Пётр", "призвание", "ловцы человеков", "чудо", "лодка"],
    },
    "Луки-5_27-39.md": {
        "title": "Луки 5:27–39",
        "subtitle": "Призвание Левия и вопрос о посте",
        "date": "2026-05",
        "tags": ["Лк. 5", "Левий", "мытари", "пост", "новое вино", "грешники"],
    },
    "Луки-6_20-39.md": {
        "title": "Луки 6:20–38",
        "subtitle": "Заповеди блаженства, любовь к врагам",
        "date": "2026-05",
        "tags": ["Лк. 6", "блаженства", "любовь к врагам", "милосердие", "горе вам"],
    },
    "Луки-6_39-49.md": {
        "title": "Луки 6:39–49",
        "subtitle": "Притчи: слепой, бревно в глазу, дом на камне",
        "date": "2026-05",
        "tags": ["Лк. 6", "притчи", "бревно", "дерево и плод", "дом на камне"],
    },
    "Луки-8_1-15.md": {
        "title": "Луки 8:1–15",
        "subtitle": "Притча о сеятеле",
        "date": "2026-05",
        "tags": ["Лк. 8", "сеятель", "почва", "Слово", "плод", "притча"],
    },
    "Луки-8_40-56.md": {
        "title": "Луки 8:40–56",
        "subtitle": "Иаир и кровоточивая – две истории веры",
        "date": "2026-05",
        "tags": ["Лк. 8", "Иаир", "кровоточивая", "вера", "исцеление", "воскрешение"],
    },
    "Луки-9_10-27.md": {
        "title": "Луки 9:10–27",
        "subtitle": "Насыщение 5000, исповедание Петра, крест ученика",
        "date": "2026-05",
        "tags": ["Лк. 9", "насыщение 5000", "исповедание Петра", "крест", "ученичество"],
    },
    "Луки-9_37-45.md": {
        "title": "Луки 9:37–45",
        "subtitle": "С горы Преображения – в долину бессилия",
        "date": "2026-05",
        "tags": ["Лк. 9", "бесноватый отрок", "неверие", "Преображение", "крест"],
    },
    # --- draft ---
    "vtoroe-prishestvie.md": {
        "title": "Второе пришествие Христа",
        "subtitle": "Подробное исследование",
        "date": "2026-03",
        "tags": ["второе пришествие", "эсхатология", "Ин. 14", "Мф. 24", "1 Фес. 4", "Откр."],
    },
}


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_frontmatter(text: str) -> tuple[dict | None, str]:
    """Возвращает (метаданные, остаток_текста). Без frontmatter -> (None, text)."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    body = text[m.end():]
    meta: dict = {}
    current_key: str | None = None
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        if ":" in line and not line.startswith(" "):
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip()
            current_key = key
            if val.startswith("[") and val.endswith("]"):
                # inline list: tags: [a, b, c]
                inner = val[1:-1]
                parts = [p.strip().strip('"').strip("'") for p in inner.split(",") if p.strip()]
                meta[key] = parts
            elif val:
                meta[key] = val.strip('"').strip("'")
            else:
                meta[key] = []  # placeholder for multiline list
        elif line.strip().startswith("- ") and current_key:
            # multiline list item
            item = line.strip()[2:].strip().strip('"').strip("'")
            if isinstance(meta.get(current_key), list):
                meta[current_key].append(item)
    return meta, body


def serialize_frontmatter(meta: dict) -> str:
    lines = ["---"]
    for key in ("title", "subtitle", "date"):
        if key in meta and meta[key]:
            val = str(meta[key]).replace('"', '\\"')
            lines.append(f'{key}: "{val}"')
    if "tags" in meta and meta["tags"]:
        tags_str = ", ".join(f'"{t}"' for t in meta["tags"])
        lines.append(f"tags: [{tags_str}]")
    lines.append("---\n\n")
    return "\n".join(lines)


def ensure_frontmatter(path: Path, default_key: str) -> dict:
    text = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    if meta is not None:
        return meta
    if default_key not in DEFAULTS:
        print(f"  ⚠️  no defaults for {default_key} – skipping", file=sys.stderr)
        return {}
    meta = DEFAULTS[default_key]
    new_text = serialize_frontmatter(meta) + body
    path.write_text(new_text, encoding="utf-8")
    print(f"  + added frontmatter to {path.name}")
    return meta


META_FILES = {"TEMPLATE.md", "AGENT_GUIDE.md", "ARCHIVE_TRACKER.md", "README.md"}

def collect(dir_path: Path, kind: str, pattern: str) -> list[dict]:
    items = []
    for p in sorted(dir_path.glob(pattern)):
        if p.name in META_FILES:
            continue
        meta = ensure_frontmatter(p, p.name)
        if not meta:
            continue
        rel = p.relative_to(ROOT).as_posix()
        item = {
            "type": kind,
            "title": meta.get("title", p.stem),
            "subtitle": meta.get("subtitle", ""),
            "date": meta.get("date", ""),
            "tags": meta.get("tags", []),
            "path": rel,
            "slug": p.stem,
        }
        if "category" in meta:
            item["category"] = meta["category"]
        items.append(item)
    return items


def main() -> None:
    sermons = collect(SERMONS_DIR, "sermon", "*.md")
    luki = collect(LUKI_DIR, "luki", "Луки-*.md")
    draft: list[dict] = []
    if DRAFT_DIR.exists():
        draft = collect(DRAFT_DIR, "draft", "*.md")
    archive: list[dict] = []
    if ARCHIVE_DIR.exists():
        archive = collect(ARCHIVE_DIR, "archive", "*.md")

    # Sort by date descending; secondary: title
    def sort_key(it: dict) -> tuple:
        return (it.get("date") or "", it.get("title") or "")
    sermons.sort(key=sort_key, reverse=True)
    draft.sort(key=sort_key, reverse=True)
    archive.sort(key=sort_key, reverse=True)

    # For Luki, sort by chapter/verse ascending so the gospel order is preserved
    def luki_key(it: dict) -> tuple:
        m = re.match(r"Луки-(\d+)_(\d+)", it["slug"])
        if m:
            return (int(m.group(1)), int(m.group(2)))
        return (99, 99)
    luki.sort(key=luki_key)

    data = {"sermons": sermons, "luki": luki, "draft": draft, "archive": archive}
    OUT_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_FILE.relative_to(ROOT)} ({len(sermons)} sermons, {len(luki)} luki, {len(draft)} draft, {len(archive)} archive)")


if __name__ == "__main__":
    main()
