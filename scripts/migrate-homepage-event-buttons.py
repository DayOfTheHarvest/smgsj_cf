#!/usr/bin/env python3
"""One-off migration: the hardcoded Today's Events / Full Calendar buttons
become standard button blocks at the head of the events `blocks` list, so
staff can relabel, restyle, reorder, or remove them like any other button.
Labels come from each locale's ui file (same strings as before).
Run: python3 scripts/migrate-homepage-event-buttons.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def migrate(loc):
    fp = os.path.join(ROOT, "src", "data", f"homepage.{loc}.json")
    ui = json.load(open(os.path.join(ROOT, "src", "data", f"ui.{loc}.json"),
                         encoding="utf-8"))
    d = json.load(open(fp, encoding="utf-8"))
    rows = [s for s in d.get("sections", []) if s.get("type") == "events"]
    assert len(rows) == 1, f"{loc}: expected 1 events row"
    blocks = rows[0].setdefault("blocks", [])
    assert all(b.get("type") != "button" or b.get("link") not in
               ("/calendar/#today", "/calendar/") for b in blocks), \
        f"{loc}: calendar buttons already migrated"
    assert ui.get("todayEvents") and ui.get("fullCalendar"), \
        f"{loc}: ui labels missing"
    rows[0]["blocks"] = [
        {"type": "button", "label": ui["todayEvents"],
         "link": "/calendar/#today", "style": "primary"},
        {"type": "button", "label": ui["fullCalendar"],
         "link": "/calendar/", "style": "outline"},
    ] + blocks
    open(fp, "w", encoding="utf-8").write(
        json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"migrated homepage.{loc}.json calendar buttons -> blocks")


for loc in ("en", "es", "vi"):
    migrate(loc)
