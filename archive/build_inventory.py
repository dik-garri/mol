#!/usr/bin/env python3
"""Build initial inventory of files to process from archive/tobeprocessed/.

Groups files by stem (filename without extension), picks the preferred source
for each (docx > pdf > pptx > pages > odt), and writes ARCHIVE_TRACKER.md.

Slug rules: transliterate Russian, replace spaces with hyphens, drop punctuation.
"""
from __future__ import annotations

import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent  # archive/
SRC_DIR = ROOT / "tobeprocessed "  # NOTE: trailing space in directory name
TRACKER = ROOT / "ARCHIVE_TRACKER.md"

# Preference order — earlier wins
EXT_PRIORITY = {".docx": 1, ".pdf": 2, ".pptx": 3, ".pages": 4, ".odt": 5}
SKIP_EXTS = {".jpg", ".jpeg", ".png", ".PNG"}

# Russian -> Latin transliteration (BGN/PCGN-ish, simplified)
TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}

def slugify(name: str) -> str:
    """Cyrillic-aware slug: transliterate, lowercase, hyphens for spaces, strip junk."""
    s = unicodedata.normalize("NFKC", name).strip().lower()
    out = []
    for ch in s:
        if ch in TRANSLIT:
            out.append(TRANSLIT[ch])
        elif ch.isalnum() or ch in "-":
            out.append(ch)
        elif ch in " \t_,.()[]{}«»\"'":
            out.append("-")
        # else: drop unknown char
    slug = "".join(out)
    # collapse multiple hyphens
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "untitled"


def main() -> None:
    files = list(SRC_DIR.iterdir())
    # Group by stem
    groups: dict[str, list[Path]] = {}
    skipped: list[Path] = []
    for f in files:
        if not f.is_file():
            continue
        if f.suffix in SKIP_EXTS or f.suffix.lower() in {ext.lower() for ext in SKIP_EXTS}:
            skipped.append(f)
            continue
        groups.setdefault(f.stem, []).append(f)

    # Sort each group by priority, pick best
    items = []
    for stem, paths in sorted(groups.items(), key=lambda kv: kv[0].lower()):
        paths.sort(key=lambda p: EXT_PRIORITY.get(p.suffix.lower(), 99))
        best = paths[0]
        slug = slugify(stem)
        items.append({"stem": stem, "slug": slug, "source": best.name, "all": [p.name for p in paths]})

    # Write tracker
    lines = [
        "# Archive – обработка `tobeprocessed/`",
        "",
        f"Всего файлов в источнике: {len(files)} (пропущено как картинки: {len(skipped)})",
        f"Уникальных тем: {len(items)}",
        "",
        "## Статусы",
        "- ⬚ pending",
        "- 🔄 in progress",
        "- ✅ done",
        "- ⚠️ нужна ручная проверка",
        "- ❌ skip / нерелевантно",
        "",
        "## Список",
        "",
        "| # | Статус | Тема | Slug | Источник | Дубликаты |",
        "|---|---|---|---|---|---|",
    ]
    for i, it in enumerate(items, 1):
        dups = ", ".join(p for p in it["all"] if p != it["source"]) or "—"
        lines.append(f"| {i} | ⬚ | {it['stem']} | `{it['slug']}` | {it['source']} | {dups} |")

    TRACKER.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {TRACKER.relative_to(ROOT.parent)} ({len(items)} unique topics, {len(files)} source files)")
    if skipped:
        print(f"Skipped (images): {len(skipped)} files")


if __name__ == "__main__":
    main()
