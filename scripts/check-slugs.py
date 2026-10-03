#!/usr/bin/env python3
"""Native-i18n slug check: every <slug>.<locale>.md must carry
slug_key == <slug> (the address is shared by all languages — set once,
never change it). A mismatch means a page's address drifted from its file.
Run: python3 scripts/check-slugs.py — add new pages, then run this before pushing."""
import glob
import os
import re
import sys

errors = []
bases = set()
for fp in sorted(glob.glob('src/content/pages/*.md')):
    stem = os.path.basename(fp)[:-3]
    m = re.fullmatch(r'(.+)\.(en|es|vi)', stem)
    if not m:
        errors.append(f'{fp}: filename must end .en.md / .es.md / .vi.md')
        continue
    base = m.group(1)
    bases.add(base)
    t = open(fp, encoding='utf-8').read()
    sk = re.search(r'^slug_key:\s*"?([^"\s]+)"?\s*$', t, re.M)
    if not sk:
        errors.append(f'{fp}: missing slug_key')
    elif sk.group(1) != base:
        errors.append(f'{fp}: slug_key={sk.group(1)!r} disagrees with filename base {base!r}')

if errors:
    print('SLUG DRIFT:')
    for e in errors:
        print(' -', e)
    sys.exit(1)
print(f'slugs OK: {len(bases)} page slugs × locales, all slug_key agree')
