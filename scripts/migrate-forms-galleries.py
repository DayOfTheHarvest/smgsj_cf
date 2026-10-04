#!/usr/bin/env python3
"""One-off migration: the Request Forms link list and the photo gallery list
move into their pages' own sections (buttons / markdown), so staff edit them
like any other page content. The sidecar files (forms.json, galleries.*.json)
and the slug-wired injections are deleted afterwards.
Run: python3 scripts/migrate-forms-galleries.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, "src", "content", "pages")


def append_section(slug, loc, lines):
    fp = os.path.join(PAGES, f"{slug}.{loc}.md")
    with open(fp, encoding="utf-8") as f:
        text = f.read()
    chunks = text.rstrip("\n").split("\n")
    assert chunks[0] == "---" and chunks[-1] == "---", fp
    fixed = chunks[:-1] + [l.rstrip("\n") for l in lines] + ["---", ""]
    open(fp, "w", encoding="utf-8").write("\n".join(fixed))
    print(f"appended {slug}.{loc}.md")


def migrate_forms():
    forms = json.load(open(os.path.join(ROOT, "src", "data", "forms.json"),
                            encoding="utf-8"))["forms"]
    assert len(forms) == 9, len(forms)
    lines = ["- type: content_section\n", "  title: ''\n", "  blocks:\n"]
    for f in forms:
        link = f["url"]
        link = f"'{link}'" if link.startswith("@") else link
        label = f["label"].replace("'", "''")
        lines += [
            "  - type: button\n",
            f"    label: '{label}'\n",
            f"    link: {link}\n",
            "    style: outline\n",
        ]
    # English page carries the list; ES/VI fall back to English (as before).
    en = open(os.path.join(PAGES, "requests.en.md"), encoding="utf-8").read()
    assert "type: button" not in en, "requests already migrated"
    append_section("requests", "en", lines)


def migrate_galleries():
    galleries = json.load(
        open(os.path.join(ROOT, "src", "data", "galleries.en.json"),
             encoding="utf-8"))["galleries"]
    assert len(galleries) == 7, len(galleries)
    rows = []
    for g in galleries:
        title = g["title"].replace("[", "\\[").replace("]", "\\]")
        if (g.get("url") or "").strip():
            rows.append(f"- [{title}]({g['url'].strip()}) — "
                        f"{g['photos']} photos")
        else:
            rows.append(f"- **{title}** — {g['photos']} photos")
    lines = ["- type: content_section\n", "  title: ''\n", "  body: |\n"]
    lines += [f"    {r}\n" for r in rows]
    en = open(os.path.join(PAGES, "photos.en.md"), encoding="utf-8").read()
    assert "9/6/2018" not in en, "photos already migrated"
    append_section("photos", "en", lines)


migrate_forms()
migrate_galleries()
