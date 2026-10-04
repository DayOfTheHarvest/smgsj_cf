#!/usr/bin/env python3
"""One-off migration: the schedule preset row becomes a self-contained
`schedule` row carrying its own buttons, so staff can relabel, restyle,
reorder, or remove the links under the Mass times like any other buttons.
Labels come from each locale's ui file (same strings and look as before,
including the arrow, play mark, and channel handle).
Run: python3 scripts/migrate-schedule-buttons.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def migrate(loc):
    fp = os.path.join(ROOT, "src", "data", f"homepage.{loc}.json")
    ui = json.load(open(os.path.join(ROOT, "src", "data", f"ui.{loc}.json"),
                         encoding="utf-8"))
    d = json.load(open(fp, encoding="utf-8"))
    rows = [s for s in d.get("sections", [])
            if s.get("type") == "preset" and s.get("id") == "schedule"]
    assert len(rows) == 1, f"{loc}: expected 1 schedule preset row"
    row = rows[0]
    assert "buttons" not in row, f"{loc}: schedule buttons already migrated"
    see_all = ui["schedule"]["seeAll"]
    stream = ui["schedule"]["stream"]
    assert see_all and stream, f"{loc}: ui schedule labels missing"
    row.clear()
    row.update({
        "type": "schedule",
        "visible": True,
        "buttons": [
            {"label": f"{see_all} →", "link": "/mass-times/",
             "style": "primary", "size": "large"},
            {"label": f"▶ {stream}: @smgsjca", "link": "@youtube",
             "style": "outline", "size": "standard"},
        ],
    })
    open(fp, "w", encoding="utf-8").write(
        json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"migrated homepage.{loc}.json schedule preset -> schedule row")


for loc in ("en", "es", "vi"):
    migrate(loc)
