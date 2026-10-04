#!/usr/bin/env python3
"""Fail if the CMS preview can drift from the site. Three checks:

1. Every page block `type` in public/admin/config.yml is handled by the
   shared renderer (src/lib/render-blocks.js). An unhandled type would render
   as nothing in BOTH site and preview.
2. Every CSS class the shared renderer (and the bespoke Mass preview) can
   emit exists in public/admin/preview.css — except `fullwidth`, which is
   intentionally unstyled on the site too.
3. Every icon offered by CMS selects exists in src/lib/icons.js.
Run: python3 scripts/check-preview.py
"""
import re
import sys

import yaml

ROOT = __import__("os").path.dirname(__import__("os").path.dirname(__file__))
ADMIN = f"{ROOT}/public/admin"
SRC = f"{ROOT}/src"

errors = []


def check(cond, msg):
    if not cond:
        errors.append(msg)


# 1. block types -----------------------------------------------------------
cfg = yaml.safe_load(open(f"{ADMIN}/config.yml", encoding="utf-8"))
pages = next(c for c in cfg["collections"] if c.get("name") == "pages")
sections = next(f for f in pages["fields"] if f.get("name") == "sections")
cms_types = set()
for t in sections["types"]:
    for f in t.get("fields", []):
        if f.get("name") == "blocks":
            cms_types.update(b["name"] for b in f.get("types", []))
render_src = open(f"{SRC}/lib/render-blocks.js", encoding="utf-8").read()
handled = set(re.findall(r"b\.type === '(\w+)'", render_src))
for t in sorted(cms_types):
    check(t in handled, f"config block type {t!r} not handled in render-blocks.js")

# 2. CSS classes ------------------------------------------------------------
css = open(f"{ADMIN}/preview.css", encoding="utf-8").read()
selectors = set(re.findall(r"[a-zA-Z0-9_-]+", css))
emitted = set()
for src in (render_src, open(f"{ADMIN}/preview.js", encoding="utf-8").read()):
    for m in re.findall(r"""class(?:Name)?=["']([^"']+)["']""", src):
        emitted.update(m.split())
    for m in re.findall(r"""class(?:Name)?\s*:\s*["']([^"']+)["']""", src):
        emitted.update(m.split())
    emitted.update(re.findall(r"""'(btn(?:-[a-z]+)?)'""", src))
allowed = {"fullwidth"}  # unstyled on the site itself, by design
for cls in sorted(emitted):
    if cls.endswith('-'):
        continue  # partial class under string concatenation (e.g. 'btn btn-' + style)
    check(cls in selectors or cls in allowed, f"class {cls!r} missing in preview.css")

# 3. icons ------------------------------------------------------------------
icons_src = open(f"{SRC}/lib/icons.js", encoding="utf-8").read()
known = set(re.findall(r"^  (\w+):", icons_src, re.M))
offered = set()
for m in re.findall(r"options: \[([^\]]*'users'[^\]]*)\]", open(f"{ADMIN}/config.yml").read()):
    offered.update(re.findall(r"'([\w-]+)'", m))
for icon in sorted(offered):
    check(icon in known, f"CMS icon {icon!r} missing in icons.js")

# 5. brand tokens ------------------------------------------------------------
# preview.css hand-mirrors the Tailwind theme (the preview iframe has no
# Tailwind runtime), so a token change must land in both files. Values that
# only exist as gradients/shadows are exempt below.
tw = open(f"{ROOT}/tailwind.config.mjs", encoding="utf-8").read()
for token in sorted(set(re.findall(r"#[0-9a-fA-F]{6}", tw))):
    check(token.lower() in css.lower(), f"token {token} missing in preview.css")
for family in ("Georgia", "system-ui"):
    check(family in css, f"font {family!r} missing in preview.css")

# 4. preview registrations --------------------------------------------------
# Every custom preview template must point at a real collection, file, or
# singleton, so renames can't silently orphan a preview.
registered = set(re.findall(r"registerPreviewTemplate\('([^']+)'", open(f"{ADMIN}/preview.js").read()))
known_targets = set()
for c in cfg["collections"]:
    if c.get("name"):
        known_targets.add(c["name"])
    for f in c.get("files", []):
        known_targets.add(f["name"])
for s in cfg.get("singletons", []):
    if "name" in s:
        known_targets.add(s["name"])
for name in sorted(registered):
    check(name in known_targets, f"preview template {name!r} has no collection/file/singleton")

if errors:
    print("PREVIEW DRIFT:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print(f"preview OK: {len(cms_types)} block types, {len(emitted)} classes, {len(offered)} icons")
