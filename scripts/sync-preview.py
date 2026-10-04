#!/usr/bin/env python3
"""Copy the shared preview renderer into public/admin (committed) so the CMS
preview loads byte-identical code to what the site builds with. Runs
automatically as the first step of `npm run build`; Astro then copies
public/admin into dist. Never hand-edit the public/admin copies.
Only relative sibling imports are allowed (the browser loads these with
native ESM and no bundler): render-blocks.js may import ./icons.js only.
"""
import hashlib
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAIRS = [
    ("src/lib/render-blocks.js", "public/admin/render-blocks.js"),
    ("src/lib/icons.js", "public/admin/icons.js"),
]

for src_rel, dst_rel in PAIRS:
    src = os.path.join(ROOT, src_rel)
    dst = os.path.join(ROOT, dst_rel)
    text = open(src, encoding="utf-8").read()
    for imp in re.findall(r"^\s*import\s.*?from\s*['\"]([^'\"]+)['\"]", text, re.M):
        assert imp in ("./icons.js", "./render-blocks.js"), f"{src_rel}: forbidden import {imp}"
    shutil.copyfile(src, dst)
    digest = hashlib.sha256(open(dst, "rb").read()).hexdigest()[:12]
    print(f"synced {dst_rel} ({digest})")
