#!/usr/bin/env python3
"""One-off migration: bulletin hand-typed labels -> auto-translated dates.

Why: every locale file carried the same English label ("October 4, 2026"),
so ES/VI never translated. The template now renders the display label from
the shared `date` via Intl, with `label` kept only as an optional override.
This script clears labels that exactly match the automatic English rendering
(verified per row) and only reports — never touches — anything else.
Run: python3 scripts/migrate-bulletin-labels.py
"""
import datetime
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")

MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def auto_en(iso):
    d = datetime.date.fromisoformat(iso[:10])
    return f"{MONTHS[d.month - 1]} {d.day}, {d.year}"


cleared = 0
kept = []
for loc in ("en", "es", "vi"):
    fp = os.path.join(DATA, f"bulletins.{loc}.json")
    with open(fp, encoding="utf-8") as f:
        data = json.load(f)
    for b in data.get("bulletins", []):
        datetime.date.fromisoformat(b["date"][:10])  # fail fast if unparseable
        label = (b.get("label") or "").strip()
        if not label:
            continue
        if label == auto_en(b["date"]):
            b["label"] = ""
            cleared += 1
        else:
            kept.append((fp, label))
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

print(f"cleared {cleared} auto-equivalent labels")
for fp, label in kept:
    print(f"KEPT custom label in {fp}: {label!r}")
