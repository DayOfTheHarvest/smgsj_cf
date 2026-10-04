#!/usr/bin/env python3
"""One-off migration: `chip` CSS suffix -> configurable `color`/`text_color`.

Why: `chip` picked a hardcoded CSS class (see .chip-* in
src/styles/global.css), so staff could not change pill colors. The new
Color-widget fields render as inline styles; the old `chip` value is kept
untouched for rollback, and code falls back to the chip class when colors
are absent. Colors are uppercase #RRGGBB to match CMS normalization.
Run: python3 scripts/migrate-language-colors.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FP = os.path.join(ROOT, "src", "data", "mass-languages.json")

# Current .chip-* palette in src/styles/global.css (Tailwind v3).
COLORS = {
    "english": ("#DBEAFE", "#1E3A8A"),  # blue-100 / blue-900
    "spanish": ("#FEF3C7", "#78350F"),  # amber-100 / amber-900
    "vietnamese": ("#DCFCE7", "#14532D"),  # green-100 / green-900
    "tagalog": ("#EDE9FE", "#4C1D95"),  # violet-100 / violet-900
}

with open(FP, encoding="utf-8") as f:
    entries = json.load(f)

assert isinstance(entries, list), "mass-languages.json must be a top-level array"

for e in entries:
    code = e.get("code", "")
    assert code, f"entry missing code: {e!r:.80}"
    if code in COLORS:
        e["color"], e["text_color"] = COLORS[code]
    else:
        e.setdefault("color", "")
        e.setdefault("text_color", "")

with open(FP, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"rewrote {FP} with {len(entries)} entries")
for e in entries:
    print(f" - {e['code']}: color={e.get('color')!r} text={e.get('text_color')!r} chip={e.get('chip')!r}")
