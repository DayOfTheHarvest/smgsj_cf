#!/usr/bin/env python3
"""One-off migration: hardcoded contact-page cards -> reusable sections.

Why: the visit/contact cards and map embed were hardcoded in
[...slug].astro. They are now plain CMS content: a "Visit Us" section (3
card blocks + map embed block) and a "Contact" section (3 card blocks),
using the generic `card` block type so the same elements work on any page.
Titles, labels, and link text come from ui.<locale>.json (translated);
proper nouns, numbers, and URLs stay identical to the old template output.
Appends to existing sections (e.g. the migrated intro body section).
Run: python3 scripts/migrate-contact-sections.py
"""
import glob
import json
import os
import urllib.parse

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, "src", "content", "pages")
DATA = os.path.join(ROOT, "src", "data")

MAP_EMBED = "https://www.google.com/maps?q=2980+Senter+Road,+San+Jose,+CA+95111&output=embed"


def enc(s):
    # Same encoding the old template used (JS encodeURIComponent).
    return urllib.parse.quote(s, safe="-_.!~*'()")


def card(icon, title, body=None, buttons=None):
    c = {"type": "card", "icon": icon, "title": title}
    if body is not None:
        c["text"] = body
    if buttons:
        c["buttons"] = buttons
    return c


def button(label, link, style):
    return {"label": label, "link": link, "style": style}


settings = json.load(open(os.path.join(DATA, "settings.json")))
SITE = settings["site_name"]
ADDR = settings["address"]
SHRINE_ADDR = settings["shrine_address"]
PHONE = settings["phone"]
EMAIL = settings["email"]
TEL = "".join(ch for ch in PHONE if ch.isdigit())
FB = settings["facebook"]
YT = settings["youtube"]

for loc in ("en", "es", "vi"):
    ui = json.load(open(os.path.join(DATA, f"ui.{loc}.json")))
    visit = {
        "type": "content_section",
        "title": ui["visitTitle"],
        "blocks": [
            card(
                "church",
                SITE,
                f"{ADDR}\n\n[{ui['mapLink']}]"
                f"(https://www.google.com/maps/search/?api=1&query={enc(ADDR)})",
            ),
            card(
                "church",
                "Vietnamese Martyrs Shrine",
                f"{SHRINE_ADDR}\n\n[{ui['mapLink']}]"
                f"(https://www.google.com/maps/search/?api=1&query={enc(SHRINE_ADDR)})",
            ),
            card(
                "users",
                ui["followUs"],
                buttons=[
                    button("Facebook", FB, "outline"),
                    button("YouTube", YT, "outline"),
                ],
            ),
            {"type": "embed", "title": "", "url": MAP_EMBED, "height": 450},
        ],
    }
    contact = {
        "type": "content_section",
        "title": ui["nav"]["contact"],
        "blocks": [
            card("phone", ui["nav"]["call"], f"[{PHONE}](tel:{TEL})"),
            card("mail", ui["footer"]["email"], f"[{EMAIL}](mailto:{EMAIL})"),
            card(
                "users",
                ui["staffTitle"],
                buttons=[button(ui["staffDir"], "/staff/", "primary")],
            ),
        ],
    }
    fp = os.path.join(PAGES, f"contact.{loc}.md")
    text = open(fp, encoding="utf-8").read()
    parts = text.split("---\n", 2)
    fm = yaml.safe_load(text.split("---\n", 2)[1]) or {}
    sections = list(fm.get("sections") or [])
    sections.extend([visit, contact])
    fm["sections"] = sections
    body = text.split("---\n", 2)[2]
    assert not body.strip(), f"{fp}: expected empty body after bodies migration"
    with open(fp, "w", encoding="utf-8") as f:
        f.write("---\n")
        f.write(
            yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, width=1000)
        )
        f.write("---\n")
    print(f"added visit+contact sections to {fp}")
