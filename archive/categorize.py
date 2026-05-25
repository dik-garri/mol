#!/usr/bin/env python3
"""Категоризирует archive/*.md, добавляя поле `category` в frontmatter.

Категории:
  series-nt  – Серии разборов НЗ (1 Тим, 1-2 Фес, 2 Петра, Иакова, Рим. 12)
  series-ot  – Серии разборов ВЗ (Числа, Второзаконие)
  attributes – Свойства Бога
  feasts     – Праздничные циклы (Рождество, Сретение, Вербное, Страстная, Пасха...)
  seminars   – Семинары
  themes     – Остальные темы (по умолчанию)
"""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
META_FILES = {"AGENT_GUIDE.md", "ARCHIVE_TRACKER.md", "README.md"}

# Категория -> список паттернов slug (substring match, case-insensitive)
RULES = [
    ("series-nt", [
        r"^1-tim-", r"^1-fes-", r"^1-fessalonikiytsam-",
        r"^2-petra-", r"^2pet-",
        r"^iakova-",
        r"^rim-",
    ]),
    ("series-ot", [
        r"^razbor-chisla-", r"^vtorozakonie-", r"^vtorozaknie-",
    ]),
    ("attributes", [
        # Свойства Бога: «Бог [прилагательное]», «Иисус [прилагательное]»
        r"^bog-lyubyashchiy", r"^bog-vseznayushchiy", r"^bog-tsar", r"^bog-velikiy",
        r"^bog-nash-pomoshchnik", r"^bog-pomoshchnik", r"^bog-sredi-nas-emmanuil",
        r"^iisus-bog-lyubyashchiy", r"^iisus-zakonodatel", r"^iisus-spasitel",
        r"^iisus-sudya", r"^iisus-uchitel-paskha", r"^iisus-tsar-a-ya-rab",
        r"^lyubyashchiy-khristos", r"^pastyr-dobryy",
        r"^kharakter-boga", r"^kharakteristiki-iisusa",
    ]),
    ("feasts", [
        r"^rozhdestvo", r"^sretenie",
        r"^verbnoe", r"^vecherya",  # Вербное, Вечеря
        r"^strastn",  # Страстная пятница/вторник/понедельник/четверг
        r"^pyatidesyatnitsa", r"^troitsa", r"^voznesenie",
        r"^kreshchenie-khristovo",  # Богоявление
        r"^novyy-god", r"^den-materi", r"^den-roditeley",
    ]),
    ("seminars", [
        r"^semenar-", r"^seminar-",
    ]),
]
# Остальное -> themes


def categorize(slug: str) -> str:
    for category, patterns in RULES:
        for p in patterns:
            if re.match(p, slug):
                return category
    return "themes"


FRONTMATTER_RE = re.compile(r"^(---\s*\n)(.*?)(\n---\s*\n)", re.DOTALL)


def add_category(md_path: Path, category: str) -> bool:
    text = md_path.read_text(encoding="utf-8")
    m = FRONTMATTER_RE.match(text)
    if not m:
        return False
    fm = m.group(2)
    # Remove existing category line if any
    fm_lines = [ln for ln in fm.splitlines() if not ln.startswith("category:")]
    # Insert category right after tags line, or at end
    tags_idx = next((i for i, ln in enumerate(fm_lines) if ln.startswith("tags:")), len(fm_lines) - 1)
    fm_lines.insert(tags_idx + 1, f'category: "{category}"')
    new_fm = "\n".join(fm_lines)
    new_text = m.group(1) + new_fm + m.group(3) + text[m.end():]
    if new_text != text:
        md_path.write_text(new_text, encoding="utf-8")
        return True
    return False


def main() -> None:
    counts = {}
    updated = 0
    for md_path in sorted(ROOT.glob("*.md")):
        if md_path.name in META_FILES:
            continue
        cat = categorize(md_path.stem)
        counts[cat] = counts.get(cat, 0) + 1
        if add_category(md_path, cat):
            updated += 1

    print(f"Updated {updated} files")
    print("Categories:")
    for cat in ("series-nt", "series-ot", "attributes", "feasts", "seminars", "themes"):
        print(f"  {cat:<12} {counts.get(cat, 0)}")


if __name__ == "__main__":
    main()
