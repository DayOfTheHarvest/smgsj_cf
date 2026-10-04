#!/usr/bin/env python3
"""One-off migration: footer link columns become CMS data (Site Settings ->
Footer Links) instead of hardcoded template links, so staff can add, remove,
or reorder them per language. Labels come from each locale's ui file (same
words as the hardcoded footer showed).
Run: python3 scripts/migrate-footer-links.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def migrate(loc):
    ui = json.load(open(os.path.join(ROOT, "src", "data", f"ui.{loc}.json"),
                         encoding="utf-8"))
    data = {
        "about_links": [
            {"label": ui["historyLink"], "link": "/about-us/"},
            {"label": ui["photosLink"], "link": "/photos/"},
            {"label": ui["staffLink"], "link": "/staff/"},
        ],
        "contact_links": [
            {"label": ui["nav"]["contact"], "link": "/contact/"},
            {"label": ui["nav"]["requests"], "link": "/requests/"},
        ],
    }
    fp = os.path.join(ROOT, "src", "data", f"footer.{loc}.json")
    open(fp, "w", encoding="utf-8").write(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"wrote footer.{loc}.json")


for loc in ("en", "es", "vi"):
    migrate(loc)
