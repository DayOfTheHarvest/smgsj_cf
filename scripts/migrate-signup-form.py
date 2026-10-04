#!/usr/bin/env python3
"""One-off migration: hardcoded FlocknoteSignup -> signup-form.en/es/vi.json.

Old: action from settings.flocknote_signup, labels from ui.*.json, 4 hardcoded inputs.
New: src/data/signup-form.{{locale}}.json (i18n true, per-locale prose):
  {title, text, action, method, target, fields:[{name, label, type, required, autocomplete, value}], submit_label}
Run: python3 scripts/migrate-signup-form.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")

settings = json.load(open(os.path.join(DATA, "settings.json"), encoding="utf-8"))
action = settings.get("flocknote_signup", "https://app.flocknote.com/group/346213/addToGroupFromOutside")

def ui(locale: str):
    return json.load(open(os.path.join(DATA, f"ui.{locale}.json"), encoding="utf-8"))

locales = {
    "en": {
        "title": ui("en").get("stayTitle", ""),
        "text": ui("en").get("stayText", ""),
        "fields": [
            {"name": "fname", "label": ui("en").get("firstName", "First Name"), "type": "text", "required": False, "autocomplete": "given-name"},
            {"name": "lname", "label": ui("en").get("lastName", "Last Name"), "type": "text", "required": False, "autocomplete": "family-name"},
            {"name": "email", "label": ui("en").get("emailAddress", "Email Address"), "type": "email", "required": False, "autocomplete": "email"},
            {"name": "mobile_phone", "label": ui("en").get("mobilePhone", "Mobile Phone"), "type": "tel", "required": False, "autocomplete": "tel"},
        ],
        "submit": ui("en").get("signUp", "Sign Me Up"),
    },
    "es": {
        "title": ui("es").get("stayTitle", ""),
        "text": ui("es").get("stayText", ""),
        "fields": [
            {"name": "fname", "label": ui("es").get("firstName", ""), "type": "text", "required": False, "autocomplete": "given-name"},
            {"name": "lname", "label": ui("es").get("lastName", ""), "type": "text", "required": False, "autocomplete": "family-name"},
            {"name": "email", "label": ui("es").get("emailAddress", ""), "type": "email", "required": False, "autocomplete": "email"},
            {"name": "mobile_phone", "label": ui("es").get("mobilePhone", ""), "type": "tel", "required": False, "autocomplete": "tel"},
        ],
        "submit": ui("es").get("signUp", ""),
    },
    "vi": {
        "title": ui("vi").get("stayTitle", ""),
        "text": ui("vi").get("stayText", ""),
        "fields": [
            {"name": "fname", "label": ui("vi").get("firstName", ""), "type": "text", "required": False, "autocomplete": "given-name"},
            {"name": "lname", "label": ui("vi").get("lastName", ""), "type": "text", "required": False, "autocomplete": "family-name"},
            {"name": "email", "label": ui("vi").get("emailAddress", ""), "type": "email", "required": False, "autocomplete": "email"},
            {"name": "mobile_phone", "label": ui("vi").get("mobilePhone", ""), "type": "tel", "required": False, "autocomplete": "tel"},
        ],
        "submit": ui("vi").get("signUp", ""),
    },
}

for loc, v in locales.items():
    out = {
        "title": v["title"],
        "text": v["text"],
        "action": action,
        "method": "post",
        "target": "_blank",
        "fields": v["fields"],
        "submit_label": v["submit"],
    }
    fp = os.path.join(DATA, f"signup-form.{loc}.json")
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {fp} with {len(v['fields'])} fields")
