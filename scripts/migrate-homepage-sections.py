#!/usr/bin/env python3
"""One-off migration: homepage top-level hero/events/catholic config moves
into self-contained section rows (like Pages), so each homepage box holds its
own settings and the Visible toggle only hides (never orphans data).

  preset {id: hero}     -> {type: hero, visible, eyebrow, title, subtitle,
                            buttons, pastor_quote}
  preset {id: events}   -> {type: events, visible, events, facility}
  preset {id: catholic} -> {type: catholic, visible, icons, ethics_*, show_phone}

Top-level hero/pastor_quote/events/facility/catholic keys are removed.
Run: python3 scripts/migrate-homepage-sections.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def migrate(loc):
    fp = os.path.join(ROOT, "src", "data", f"homepage.{loc}.json")
    d = json.load(open(fp, encoding="utf-8"))
    sections = d.get("sections", [])
    ids = [s.get("id") for s in sections if s.get("type") == "preset"]
    assert sorted(ids) == sorted(
        ["carousel", "hero", "actions", "schedule", "events",
         "body", "office", "flocknote", "catholic"]
    ), f"{loc}: unexpected preset rows {ids}"
    assert set(d.keys()) == {
        "sections", "hero", "pastor_quote", "events", "facility", "catholic",
    }, f"{loc}: unexpected top-level keys {sorted(d.keys())}"

    hero = d.pop("hero")
    pastor_quote = d.pop("pastor_quote")
    events = d.pop("events")
    facility = d.pop("facility")
    catholic = d.pop("catholic")

    def swap(pid, row):
        for i, s in enumerate(sections):
            if s.get("type") == "preset" and s.get("id") == pid:
                row = {"type": row[0], "visible": s.get("visible", True),
                       **row[1]}
                sections[i] = row
                return
        raise AssertionError(f"{loc}: no preset row {pid}")

    swap("hero", ("hero", {**hero, "pastor_quote": pastor_quote}))
    swap("events", ("events", {"events": events, "facility": facility}))
    swap("catholic", ("catholic", catholic))

    open(fp, "w", encoding="utf-8").write(
        json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"migrated homepage.{loc}.json")


for loc in ("en", "es", "vi"):
    migrate(loc)
