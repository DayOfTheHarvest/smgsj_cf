#!/usr/bin/env python3
"""One-off migration: settings.json emergency strings -> emergencies list.

Old:
  {"emergency_en_es": "408-363-2311", "emergency_vi": "408-363-2310", ...}
New (embedded labels, i18n false on list):
  {"emergencies": [
    {"id": "en-es", "label_en": "English / Español", "label_es": "English / Español",
     "label_vi": "English / Español", "number": "408-363-2311"},
    {"id": "vi", "label_en": "Tiếng Việt", "label_es": "Tiếng Việt",
     "label_vi": "Tiếng Việt", "number": "408-363-2310"}
  ], ...}
Old keys are kept for rollback safety (code falls back if new array missing).
Run: python3 scripts/migrate-emergencies.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")
FP = os.path.join(DATA, "settings.json")

with open(FP, encoding="utf-8") as f:
    settings = json.load(f)

en_es = settings.get("emergency_en_es", "408-363-2311")
vi = settings.get("emergency_vi", "408-363-2310")

if "emergencies" not in settings:
    settings["emergencies"] = [
        {
            "id": "en-es",
            "label_en": "English / Español",
            "label_es": "English / Español",
            "label_vi": "English / Español",
            "number": en_es,
        },
        {
            "id": "vi",
            "label_en": "Tiếng Việt",
            "label_es": "Tiếng Việt",
            "label_vi": "Tiếng Việt",
            "number": vi,
        },
    ]
    print("added emergencies array with 2 rows")
else:
    print("emergencies already present, leaving as-is")

# Keep old keys for rollback safety; code prefers new array.
with open(FP, "w", encoding="utf-8") as f:
    json.dump(settings, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"rewrote {FP}")
