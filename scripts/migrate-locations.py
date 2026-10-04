#!/usr/bin/env python3
"""One-off migration: locations.en/es/vi.json -> locations.json (single-file entry collection).

Old shape (per-locale files):
  {"locations": [{"name": "Church", "text": "Church"}, ...]}
New shape (single-file, i18n true):
  [{"key": "church", "en": {"name": "Church"}, "es": {"name": "..."}, "vi": {"name": "..."}}, ...]
Duplicate `key` lives at object root; translatable `name` nests per locale.
Run: python3 scripts/migrate-locations.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")

def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s

# Manual overrides for clean keys (avoid ugly viet-martyr-s-shrine)
OVERRIDES = {
    "Church": "church",
    "Patio": "patio",
    "Divine Mercy Chapel": "divine-mercy-chapel",
    "Viet. Martyr's Shrine": "viet-martyrs-shrine",
}

def load(locale: str):
    fp = os.path.join(DATA, f"locations.{locale}.json")
    with open(fp, encoding="utf-8") as f:
        return json.load(f)["locations"]

en = load("en")
es = load("es")
vi = load("vi")

es_by_name = {r["name"]: r["text"] for r in es}
vi_by_name = {r["name"]: r["text"] for r in vi}

out = []
for row in en:
    name = row["name"]
    key = OVERRIDES.get(name, slugify(name))
    out.append({
        "key": key,
        "en": {"name": row["text"]},
        "es": {"name": es_by_name.get(name, row["text"])},
        "vi": {"name": vi_by_name.get(name, row["text"])},
    })

out_fp = os.path.join(DATA, "locations.json")
with open(out_fp, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"wrote {out_fp} with {len(out)} entries")
for e in out:
    print(f" - {e['key']}: en={e['en']['name']!r} es={e['es']['name']!r} vi={e['vi']['name']!r}")
