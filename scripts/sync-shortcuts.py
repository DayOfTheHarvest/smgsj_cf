#!/usr/bin/env python3
"""Regenerate the CMS shortcut reference from src/config.ts (single source).

The site resolves @aliases in resolveLink() (src/config.ts) against EXTERNAL
URLs, which come from Site Settings fields. The staff-facing list (the Link
Shortcuts page default + backing JSON + the settings description sentence) is
derived from that map, so adding an alias in code propagates on the next
build instead of going stale. Runs automatically as part of `npm run build`.

Run: python3 scripts/sync-shortcuts.py [--check]
  --check exits 1 (printing the drift) when generated text differs.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_TS = os.path.join(ROOT, "src", "config.ts")
ADMIN_YML = os.path.join(ROOT, "public", "admin", "config.yml")
DATA_JSON = os.path.join(ROOT, "src", "data", "link-shortcuts.json")

ts = open(CONFIG_TS, encoding="utf-8").read()

external_body = re.search(
    r"export const EXTERNAL = \{(.*?)\} as const", ts, re.S
).group(1)
prop_to_field = dict(
    re.findall(r"(\w+):\s*settings\.(\w+)", external_body)
)

resolver_body = re.search(
    r"const aliases: Record<string, string> = \{(.*?)\};", ts, re.S
).group(1)
aliases = re.findall(r"'(@[\w-]+)':\s*EXTERNAL\.(\w+)", resolver_body)
assert aliases, "no @aliases found in src/config.ts resolveLink"

import yaml  # noqa: E402  (pyyaml, already required by check-preview.py)

cfg = yaml.safe_load(open(ADMIN_YML, encoding="utf-8"))
site = next(c for c in cfg["collections"] if c.get("name") == "site")
settings_file = next(f for f in site["files"] if f.get("name") == "settings")
labels = {}

def walk(fields):
    for f in fields or []:
        if f.get("name"):
            labels[f["name"]] = f.get("label", f["name"])
        walk(f.get("fields"))

walk(settings_file.get("fields"))

lines, inline, warnings = [], [], []
for alias, prop in aliases:
    field = prop_to_field.get(prop)
    label = labels.get(field) if field else None
    if not label:
        warnings.append(f"{alias}: no Site Settings field for EXTERNAL.{prop}")
        lines.append(f"{alias} — follows code; no matching Site Settings field.")
        inline.append(f"{alias} (see code)")
        continue
    title = re.sub(r"\s+URL$", "", label)
    lines.append(f"{alias} — {title}. Uses the {label}.")
    inline.append(f"{alias} ({title})")

list_text = "\n".join(lines)
prose = (
    "Link shortcuts staff can type in any link field: "
    + ", ".join(inline)
    + " — each follows its URL on this screen automatically."
)

raw = open(ADMIN_YML, encoding="utf-8").read()

# 1. Link Shortcuts page default block (literal lines, 14-space indent).
m = re.search(r"(            default: \|\n)((?:              .*\n)+)", raw)
assert m, "link-shortcuts default block not found"
new_block = "".join(f"              {ln}\n" for ln in lines)
raw = raw[: m.start(2)] + new_block + raw[m.end(2) :]

# 2. Settings description sentence (>-folded, so rewrap freely at 10 spaces).
m2 = re.search(
    r"Link shortcuts staff can type in any link field:.*?automatically\.",
    raw,
    re.S,
)
assert m2, "settings shortcut sentence not found"
words, out, col = prose.split(" "), [], 10
for w in words:
    if col + len(w) + 1 > 78:
        out.append("\n          ")
        col = 10
    out.append((" " if col > 10 else "") + w)
    col += len(w) + 1
raw = raw[: m2.start()] + "".join(out) + raw[m2.end() :]

new_json = json.dumps({"shortcuts": list_text}, indent=2) + "\n"
old_json = open(DATA_JSON, encoding="utf-8").read()

if "--check" in sys.argv:
    problems = []
    if raw != open(ADMIN_YML, encoding="utf-8").read():
        problems.append("config.yml shortcut text stale (run without --check)")
    if new_json != old_json:
        problems.append("link-shortcuts.json stale (run without --check)")
    if problems:
        print("SHORTCUT DRIFT:")
        for p in problems:
            print(" -", p)
        sys.exit(1)
    print(f"shortcuts OK: {len(aliases)} aliases match code")
    sys.exit(0)

open(ADMIN_YML, "w", encoding="utf-8").write(raw)
open(DATA_JSON, "w", encoding="utf-8").write(new_json)
for w in warnings:
    print("warning:", w)
print(f"synced shortcuts ({len(aliases)} aliases)")
