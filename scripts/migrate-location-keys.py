#!/usr/bin/env python3
"""One-off migration: nest the location `key` inside each locale object.

Why: Sveltia stores `duplicate` field values inside every locale
("the same value is stored for all locales"), so a root-level-only `key`
never reaches the editor and shows as missing. New shape per entry:
  {"key": "church", "en": {"key": "church", "name": "..."}, ...}
The root copy is kept for back-compat; readers prefer the per-locale key.
Run: python3 scripts/migrate-location-keys.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FP = os.path.join(ROOT, "src", "data", "locations.json")

with open(FP, encoding="utf-8") as f:
    entries = json.load(f)

assert isinstance(entries, list), "locations.json must be a top-level array"

for e in entries:
    key = e.get("key") or (e.get("en") or {}).get("key") or ""
    assert key, f"entry missing key: {e!r:.80}"
    e["key"] = key
    for loc in ("en", "es", "vi"):
        loc_obj = e.get(loc)
        assert isinstance(loc_obj, dict), f"{key}: missing {loc} object"
        loc_obj["key"] = key

with open(FP, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"rewrote {FP} with {len(entries)} entries")
for e in entries:
    assert e["key"] == e["en"]["key"] == e["es"]["key"] == e["vi"]["key"]
    print(f" - {e['key']}")
