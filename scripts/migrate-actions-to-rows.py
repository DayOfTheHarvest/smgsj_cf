#!/usr/bin/env python3
"""One-off migration: the Actions preset row becomes a generic custom row
whose blocks are cards (one live bulletin list + generic cards), so staff
edit action cards like any other cards. The sidecar actions.*.json files,
their CMS screen, and the bespoke renderers are deleted afterwards.
Run: python3 scripts/migrate-actions-to-rows.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUTTON_STYLES = {"primary", "gold", "outline", "light"}


def action_to_card(c, limit):
    if c.get("kind") == "bulletins":
        return {
            "type": "card",
            "icon": c.get("icon"),
            "title": c.get("title"),
            "kind": "bulletins",
            "limit": limit,
        }
    buttons = []
    if (c.get("link") or "").strip():
        buttons.append({
            "label": c.get("link_label") or c.get("title"),
            "link": c["link"],
            "style": c.get("style") or "primary",
        })
    if (c.get("extra_link") or "").strip():
        style = c.get("extra_style") or ""
        buttons.append({
            "label": c.get("extra_label") or c.get("extra_link"),
            "link": c["extra_link"],
            "style": style if style in BUTTON_STYLES else "outline",
        })
    return {
        "type": "card",
        "icon": c.get("icon"),
        "title": c.get("title"),
        "text": c.get("text") or "",
        "buttons": buttons,
        "buttons_layout": "stacked",
    }


def migrate(loc):
    fp = os.path.join(ROOT, "src", "data", f"homepage.{loc}.json")
    actions = json.load(open(os.path.join(ROOT, "src", "data",
                                           f"actions.{loc}.json"),
                              encoding="utf-8"))
    d = json.load(open(fp, encoding="utf-8"))
    idx = next(i for i, s in enumerate(d["sections"])
               if s.get("type") == "preset" and s.get("id") == "actions")
    row = d["sections"][idx]
    limit = actions.get("bulletins_limit", 5)
    blocks = [action_to_card(c, limit) for c in actions["cards"]]
    assert len(blocks) == 4, (loc, len(blocks))
    d["sections"][idx] = {
        "type": "custom",
        "title": "",
        "visible": row.get("visible", True),
        "blocks": blocks,
    }
    open(fp, "w", encoding="utf-8").write(
        json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"migrated homepage.{loc}.json actions preset -> custom row")


for loc in ("en", "es", "vi"):
    migrate(loc)
