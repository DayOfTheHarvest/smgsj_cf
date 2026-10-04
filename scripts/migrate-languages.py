#!/usr/bin/env python3
"""One-off migration: static Mass languages -> mass-languages.json + masses.json codes.

Old MassRow.lang union: English | Español | Vietnamese | Tagalog
New codes: english | spanish | vietnamese | tagalog (value_field=code)
Autonyms: English | Español | Tiếng Việt | Tagalog (display)
Chips: existing CSS suffixes (english, es, vi, tagalog) preserved.

Writes:
  src/data/mass-languages.json (single-file, i18n false)
  rewrites src/data/masses.json lang values to codes (location values to keys if needed)
Run: python3 scripts/migrate-languages.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")

LANGS = [
    {"code": "english", "autonym": "English", "chip": "english"},
    {"code": "spanish", "autonym": "Español", "chip": "es"},
    {"code": "vietnamese", "autonym": "Tiếng Việt", "chip": "vi"},
    {"code": "tagalog", "autonym": "Tagalog", "chip": "tagalog"},
]

LANG_MAP = {
    "English": "english",
    "Español": "spanish",
    "Vietnamese": "vietnamese",
    "Tagalog": "tagalog",
    # already-migrated codes pass through
    "english": "english",
    "spanish": "spanish",
    "vietnamese": "vietnamese",
    "tagalog": "tagalog",
}

# Location names -> keys (must match migrate-locations.py overrides)
LOC_MAP = {
    "Church": "church",
    "Patio": "patio",
    "Divine Mercy Chapel": "divine-mercy-chapel",
    "Viet. Martyr's Shrine": "viet-martyrs-shrine",
    # already-migrated keys pass through
    "church": "church",
    "patio": "patio",
    "divine-mercy-chapel": "divine-mercy-chapel",
    "viet-martyrs-shrine": "viet-martyrs-shrine",
}

out_fp = os.path.join(DATA, "mass-languages.json")
with open(out_fp, "w", encoding="utf-8") as f:
    json.dump(LANGS, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"wrote {out_fp} with {len(LANGS)} entries")

masses_fp = os.path.join(DATA, "masses.json")
with open(masses_fp, encoding="utf-8") as f:
    masses = json.load(f)

converted = 0
for r in masses.get("masses", []):
    old_lang = r.get("lang", "")
    if old_lang in LANG_MAP:
        if r["lang"] != LANG_MAP[old_lang]:
            r["lang"] = LANG_MAP[old_lang]
            converted += 1
    else:
        print(f"WARNING: unknown lang {old_lang!r}, leaving as-is")
    old_loc = r.get("location", "")
    if old_loc in LOC_MAP:
        if r["location"] != LOC_MAP[old_loc]:
            r["location"] = LOC_MAP[old_loc]
    else:
        print(f"WARNING: unknown location {old_loc!r}, leaving as-is")

with open(masses_fp, "w", encoding="utf-8") as f:
    json.dump(masses, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"rewrote {masses_fp}: {converted} lang values converted to codes")
