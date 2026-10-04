#!/usr/bin/env python3
"""One-off migration: staff directory becomes a section widget.

Why: the member grid was hardcoded to the staff route in [...slug].astro.
A generic `{type: staff}` block (data comes from the staff files per viewing
locale) renders the same grid on any page. Appends one widget section to the
staff pages in all three locales; structures stay aligned.
Run: python3 scripts/migrate-staff-widget.py
"""
import os

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, "src", "content", "pages")

WIDGET = {"type": "content_section", "title": "", "blocks": [{"type": "staff"}]}

for loc in ("en", "es", "vi"):
    fp = os.path.join(PAGES, f"staff.{loc}.md")
    text = open(fp, encoding="utf-8").read()
    parts = text.split("---\n", 2)
    fm = yaml.safe_load(parts[1]) or {}
    sections = list(fm.get("sections") or [])
    assert all(
        not any((b.get("type") == "staff") for b in (s.get("blocks") or []))
        for s in sections
    ), f"{fp}: staff widget already present"
    sections.append(WIDGET)
    fm["sections"] = sections
    with open(fp, "w", encoding="utf-8") as f:
        f.write("---\n")
        f.write(yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, width=1000))
        f.write("---\n")
    print(f"appended staff widget to {fp}")
