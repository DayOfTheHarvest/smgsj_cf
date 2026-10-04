#!/usr/bin/env python3
"""Regenerate every CMS icon option list from src/lib/icons.js (single source).

Staff pick icons by name, so an icon missing from a field's `options` shows
a blank select instead of the stored value. Deriving all lists from the
artwork file keeps them complete on every build instead of going stale.
Regex-only (no PyYAML) so it also runs in build envs without it.
Runs automatically as part of `npm run build`.

Run: python3 scripts/sync-icons.py [--check]
  --check exits 1 (printing the drift) when a list differs.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_JS = os.path.join(ROOT, "src", "lib", "icons.js")
ADMIN_YML = os.path.join(ROOT, "public", "admin", "config.yml")

names = re.findall(r"^  (\w+):", open(ICONS_JS, encoding="utf-8").read(), re.M)
assert names, "no icons found in src/lib/icons.js"
canonical = "options: [" + ", ".join(f"'{n}'" for n in names) + "]"

raw = open(ADMIN_YML, encoding="utf-8").read()


def is_icon_list(m):
    return "'users'" in m.group(0)


new, count = re.subn(
    r"options: \[[^\]\n]*'users'[^\]\n]*\]",
    lambda m: canonical if is_icon_list(m) else m.group(0),
    raw,
)
assert count, "no CMS icon option lists found"

if "--check" in sys.argv:
    if new != raw:
        print("ICON DRIFT: icon option lists differ from src/lib/icons.js")
        print("  run without --check to regenerate")
        sys.exit(1)
    print(f"icons OK: {count} lists offer all {len(names)} icons")
    sys.exit(0)

open(ADMIN_YML, "w", encoding="utf-8").write(new)
print(f"synced icons ({count} lists, {len(names)} icons)")
