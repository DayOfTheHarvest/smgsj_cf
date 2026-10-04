#!/usr/bin/env python3
"""One-off migration: homepage events `facility` object becomes a generic
page-widget `blocks` list (same types as Pages sections), so staff can add
text, buttons, thermometers, images, or embeds under the event cards.

  facility {link_label, tail} -> blocks [{richtext tail},
                                         {button link_label -> @calendar-suggest}]
Run: python3 scripts/migrate-homepage-facility.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def migrate(loc):
    fp = os.path.join(ROOT, "src", "data", f"homepage.{loc}.json")
    before = open(fp, "rb").read()
    d = json.loads(before.decode("utf-8"))
    rows = [s for s in d.get("sections", []) if s.get("type") == "events"]
    assert len(rows) == 1, f"{loc}: expected 1 events row"
    row = rows[0]
    fac = row.pop("facility", {})
    assert set(fac.keys()) <= {"link_label", "tail"}, f"{loc}: {sorted(fac)}"
    blocks = []
    if (fac.get("tail") or "").strip():
        blocks.append({"type": "richtext", "body": fac["tail"]})
    if (fac.get("link_label") or "").strip():
        blocks.append({
            "type": "button",
            "label": fac["link_label"],
            "link": "@calendar-suggest",
            "style": "outline",
        })
    row["blocks"] = blocks
    open(fp, "w", encoding="utf-8").write(
        json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"migrated homepage.{loc}.json facility -> {len(blocks)} blocks")


for loc in ("en", "es", "vi"):
    migrate(loc)
