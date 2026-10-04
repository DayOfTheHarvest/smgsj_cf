#!/usr/bin/env python3
"""One-off migration: align every locale's sections to the English layout.

Why: page sections pair by position at render time, so a locale missing a
leading row (e.g. no intro body) shifted every later row onto the wrong
English row and appended the English tail as duplicates (contact + map embed
on ES/VI, double thermometer on campaign ES/VI). The renderer now treats the
English layout as the source of truth; this script makes the stored data
match it: each non-English row is greedily matched to the earliest unmatched
English row with the same type and block signature, and unmatched English
rows get an empty `{type}` shell that falls back to English when rendered.
Locale rows matching nothing are never deleted silently: their file is left
untouched and reported for a human to look at.
Run: python3 scripts/align-section-layouts.py
"""
import glob
import os

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, "src", "content", "pages")


def read(fp):
    text = open(fp, encoding="utf-8").read()
    parts = text.split("---\n", 2)
    return yaml.safe_load(parts[1]) or {}, parts[0], parts[2]


def write(fp, fm):
    with open(fp, "w", encoding="utf-8") as f:
        f.write("---\n")
        f.write(yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, width=1000))
        f.write("---\n")


def sig(row):
    blocks = row.get("blocks") or []
    return (row.get("type"), tuple(b.get("type") for b in blocks))


bundles = {}
for fp in sorted(glob.glob(os.path.join(PAGES, "*.md"))):
    base = os.path.basename(fp)
    slug, loc, _ = base.rsplit(".", 2)
    bundles.setdefault(slug, {})[loc] = fp

aligned = 0
shells = 0
skipped = []
for slug, files in sorted(bundles.items()):
    if "en" not in files:
        continue
    fm_en, _, _ = read(files["en"])
    en = list(fm_en.get("sections") or [])
    if not en:
        continue
    for loc, fp in sorted(files.items()):
        if loc == "en":
            continue
        fm, _, _ = read(fp)
        loc_rows = list(fm.get("sections") or [])
        if not loc_rows:
            continue  # empty: full English fallback already
        used = [False] * len(en)
        placed = []
        dropped = []
        for row in loc_rows:
            hit = next(
                (
                    i
                    for i, e in enumerate(en)
                    if not used[i] and sig(e) == sig(row)
                ),
                None,
            )
            if hit is None:
                dropped.append(row)
            else:
                used[hit] = True
                placed.append((hit, row))
        if dropped:
            skipped.append((fp, len(dropped)))
            continue
        by_en = dict(placed)
        fm["sections"] = [
            by_en[i] if i in by_en else {"type": e.get("type")}
            for i, e in enumerate(en)
        ]
        shells += sum(1 for i in range(len(en)) if i not in by_en)
        write(fp, fm)
        aligned += 1

print(f"aligned {aligned} locale files, inserted {shells} empty shells")
for fp, n in skipped:
    print(f"SKIPPED (needs human look): {fp} drops {n} unmatched row(s)")
