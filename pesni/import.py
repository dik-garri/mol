#!/usr/bin/env python3
"""
Импортёр песен из sbornik.sbena.net (альбом mol_FVZflEV) в data/songs.json.

Запуск:
    python3 pesni/import.py

Поведение:
- Идёт по номерам с 1
- Останавливается после 30 пустых ответов подряд ("Гимн не найден")
- Сохраняет результат в pesni/data/songs.json
- Парсит HTML по той же логике, что band/src/lib/sbornikImporter.ts
"""

import json
import re
import sys
import time
import urllib.request
from pathlib import Path
from typing import Optional

ALBUM = "mol_FVZflEV"
API_URL = "https://sbornik.sbena.net/api/album/{album}/{num}"
OUTPUT_JSON = Path(__file__).parent / "data" / "songs.json"
OUTPUT_JS = Path(__file__).parent / "data" / "songs.js"
MAX_CONSECUTIVE_MISSING = 30
RATE_LIMIT_SLEEP = 0.1  # сек между запросами

CYRILLIC_TO_LATIN = {"А": "A", "В": "B", "С": "C", "Е": "E", "Н": "H"}
SUPERSCRIPT_MAP = {"⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
                   "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9"}


def normalize_superscripts(text: str) -> str:
    return "".join(SUPERSCRIPT_MAP.get(ch, ch) for ch in text)


def normalize_cyrillic_chords(chord: str) -> str:
    return "".join(CYRILLIC_TO_LATIN.get(ch, ch) for ch in chord)


def strip_html_tags(html: str) -> str:
    return re.sub(r"</?[^>]+>", "", html)


def convert_line_with_chords(raw: str) -> tuple[str, str]:
    """
    Берёт строку вида "Тв{D}ердо я верю: м{G}ой Иис{D}ус!"
    Возвращает (chord_line, text_line):
      "  D       G   D"
      "Твердо я верю: мой Иисус!"
    """
    chord_line = ""
    text_line = ""
    i = 0
    while i < len(raw):
        if raw[i] == "{":
            end = raw.find("}", i)
            if end == -1:
                text_line += raw[i]
                i += 1
                continue
            chord = normalize_cyrillic_chords(normalize_superscripts(raw[i + 1:end]))
            # выровнять начало аккорда с текущей позицией текста
            while len(chord_line) < len(text_line):
                chord_line += " "
            chord_line += chord
            i = end + 1
        else:
            text_line += raw[i]
            i += 1
    return chord_line.rstrip(), text_line


# regex для парсинга <div class=...>
DIV_RE = re.compile(r'<div\s+class=(?:"([^"]+)"|(\w+))>([\s\S]*?)</div>', re.IGNORECASE)


def parse_text_to_blocks(html: str) -> list[dict]:
    """
    Парсит HTML песни в список блоков:
      [{"label": "Куплет 1", "lines": [[chord, text], ...]}, ...]
    """
    blocks = []
    current_label: Optional[str] = None
    current_lines: list = []

    for m in DIV_RE.finditer(html):
        cls = (m.group(1) or m.group(2) or "").strip()
        inner = m.group(3)

        if cls in ("verse", "repeat") or cls.startswith("repeat"):
            # это заголовок блока (Куплет N, Припев и т.п.)
            if current_label is not None and current_lines:
                blocks.append({"label": current_label, "lines": current_lines})
            current_label = strip_html_tags(inner).strip()
            current_lines = []
        elif cls.startswith("part"):
            stripped = strip_html_tags(inner)
            for line in stripped.split("\n"):
                trimmed = line.strip()
                if not trimmed:
                    continue
                chord, text = convert_line_with_chords(trimmed)
                current_lines.append([chord, text])

    if current_label is not None and current_lines:
        blocks.append({"label": current_label, "lines": current_lines})
    elif current_lines and not blocks:
        # песня без явных заголовков
        blocks.append({"label": "", "lines": current_lines})

    return blocks


def extract_first_chord(html: str) -> str:
    norm = normalize_cyrillic_chords(normalize_superscripts(html))
    m = re.search(r"\{([A-H][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13)*\d?(?:/[A-H][#b]?)?)\}", norm)
    return m.group(1) if m else ""


def fetch_song(num: int) -> Optional[dict]:
    url = API_URL.format(album=ALBUM, num=num)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  ERROR fetching {num}: {e}", file=sys.stderr)
        return None

    if "Error" in data or "Data" not in data:
        return None

    d = data["Data"]
    text = d.get("Text", "")
    blocks = parse_text_to_blocks(text)
    key = d.get("Key", "") or extract_first_chord(text)

    return {
        "number": d["Number"],
        "title": d["Title"],
        "key": key,
        "blocks": blocks,
    }


def main():
    songs = []
    consecutive_missing = 0
    n = 1

    while consecutive_missing < MAX_CONSECUTIVE_MISSING:
        song = fetch_song(n)
        if song is None:
            consecutive_missing += 1
            print(f"  {n}: пусто ({consecutive_missing}/{MAX_CONSECUTIVE_MISSING})")
        else:
            consecutive_missing = 0
            songs.append(song)
            print(f"  {n}: {song['title']} [{song['key']}]")
        n += 1
        time.sleep(RATE_LIMIT_SLEEP)

    print(f"\nИмпортировано песен: {len(songs)}")
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)
    print(f"Сохранено JSON: {OUTPUT_JSON}")
    # JS-вариант для запуска через file:// (без CORS)
    with OUTPUT_JS.open("w", encoding="utf-8") as f:
        f.write("window.SONGS_DATA = ")
        json.dump(songs, f, ensure_ascii=False)
        f.write(";\n")
    print(f"Сохранено JS:   {OUTPUT_JS}")


if __name__ == "__main__":
    main()
