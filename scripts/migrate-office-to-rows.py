#!/usr/bin/env python3
"""One-off migration: the Office preset row becomes a generic custom row
whose blocks are live cards (office hours, emergency numbers, contact), so
staff can reorder, rename, or remove them like any other cards. Titles come
from each locale's ui file (same words as the hardcoded section showed).
Run: python3 scripts/migrate-office-to-rows.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def migrate(loc):
    fp = os.path.join(ROOT, "src", "data", f"homepage.{loc}.json")
    ui = json.load(open(os.path.join(ROOT, "src", "data", f"ui.{loc}.json"),
                         encoding="utf-8"))
    d = json.load(open(fp, encoding="utf-8"))
    idx = next(i for i, s in enumerate(d["sections"])
               if s.get("type") == "preset" and s.get("id") == "office")
    row = d["sections"][idx]
    d["sections"][idx] = {
        "type": "custom",
        "title": ui["contactSection"],
        "visible": row.get("visible", True),
        "blocks": [
            {"type": "card", "icon": "clock",
             "title": ui["schedule"]["office"], "kind": "hours"},
            {"type": "card", "icon": "alert",
             "title": ui["footer"]["emergency"], "kind": "emergency"},
            {"type": "card", "icon": "phone",
             "title": ui["contactCard"], "kind": "contact"},
        ],
    }
    open(fp, "w", encoding="utf-8").write(
        json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"migrated homepage.{loc}.json office preset -> custom row")


for loc in ("en", "es", "vi"):
    migrate(loc)
