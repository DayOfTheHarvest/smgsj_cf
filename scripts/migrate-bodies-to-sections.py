#!/usr/bin/env python3
"""One-off migration: page markdown bodies + top-level blocks -> sections.

Why: the page body was a special-cased single field; sections are now the
only page content model (title + sections). For every
src/content/pages/<slug>.<locale>.md:
  - non-empty markdown body -> leading {type: content_section, body}
  - non-empty top-level `blocks` (campaign fundraiser) -> trailing
    {type: content_section, blocks} (preserves body-before-widget order)
  - file body left empty; `blocks` key removed.
Per-locale files migrate independently, so existing translations are kept and
the localize() fallback (missing -> English) keeps working as before.
Run: python3 scripts/migrate-bodies-to-sections.py
"""
import glob
import os

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, "src", "content", "pages")


def split_frontmatter(text):
    lines = text.split("\n")
    assert lines[0] == "---", "missing opening frontmatter"
    for i in range(1, len(lines)):
        if lines[i] == "---":
            return lines[1:i], "\n".join(lines[i + 1 :])
    raise AssertionError("missing closing frontmatter")


def dump(fm):
    return "---\n" + yaml.safe_dump(
        fm, allow_unicode=True, sort_keys=False, width=1000
    ) + "---\n"


moved_bodies = 0
moved_blocks = 0
touched = 0
for fp in sorted(glob.glob(os.path.join(PAGES, "*.md"))):
    with open(fp, encoding="utf-8") as f:
        fm_lines, body = split_frontmatter(f.read())
    fm = yaml.safe_load("\n".join(fm_lines)) or {}
    sections = list(fm.get("sections") or [])
    prefix = []
    if body.strip():
        prefix.append(
            {"type": "content_section", "title": "", "body": body.strip()}
        )
        moved_bodies += 1
    blocks = fm.pop("blocks", None)
    if blocks:
        assert isinstance(blocks, list)
        prefix.append({"type": "content_section", "title": "", "blocks": blocks})
        moved_blocks += len(blocks)
    if not prefix:
        continue
    fm["sections"] = prefix + sections
    with open(fp, "w", encoding="utf-8") as f:
        f.write(dump(fm))
    touched += 1

print(f"migrated {moved_bodies} bodies and {moved_blocks} blocks in {touched} files")
