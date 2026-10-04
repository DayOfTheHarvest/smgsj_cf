#!/usr/bin/env python3
"""Fail if the project can rot from the outside: unpinned CDN bundles,
floating deploy tooling, non-stdlib build scripts, executable remote pulls
in site/admin code, or a Worker config that could reintroduce server builds.

Stdlib only (no PyYAML) so it runs first in `npm run build`, including on
Cloudflare. Local gates get it free through the same command.

Run: python3 scripts/check-pins.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []


def check(cond, msg):
    if not cond:
        errors.append(msg)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


# 1. CDN bundles must be version-pinned --------------------------------------
# An unpinned @sveltia/cms floats into breaking releases (v1.0 GA pending).
code_files = []
for base, exts in (("src", (".astro", ".js", ".ts", ".css")),
                   ("public/admin", (".html", ".js", ".css"))):
    for dirpath, _, filenames in os.walk(os.path.join(ROOT, base)):
        for fn in filenames:
            if fn.endswith(exts):
                code_files.append(os.path.join(dirpath, fn))
for fp in code_files:
    for i, line in enumerate(open(fp, encoding="utf-8"), 1):
        for m in re.finditer(r"https://(?:unpkg\.com|cdn\.jsdelivr\.net)/\S+",
                             line):
            url = m.group(0).rstrip("\"'<>),;")
            if not re.search(r"@\d+\.\d+\.\d+[/)]", url + "/"):
                check(False, f"{os.path.relpath(fp, ROOT)}:{i}: "
                             f"unpinned CDN URL {url}")

# 2. Deploy tooling must be exact --------------------------------------------
pkg = json.loads(read("package.json"))
for dep in ("wrangler", "pagefind"):
    ver = pkg.get("devDependencies", {}).get(dep, "")
    check(bool(re.fullmatch(r"\d+\.\d+\.\d+", ver)),
          f"package.json: {dep} must be exact-pinned (got {ver!r})")
check(os.path.exists(os.path.join(ROOT, "package-lock.json")),
      "package-lock.json missing: npm clean-install would float")

# 3. Build-time scripts must be stdlib-only ----------------------------------
# The one exception is `yaml` with an ImportError fallback (build envs lack
# PyYAML, so the script must degrade to regex instead of crashing).
stdlib = set(sys.stdlib_module_names)
for script in ("scripts/check-pins.py", "scripts/sync-icons.py",
               "scripts/sync-shortcuts.py", "scripts/sync-preview.py",
               "scripts/sitemap.py"):
    src = read(script)
    imported = set(re.findall(r"^\s*import\s+([\w.]+)", src, re.M))
    imported.update(re.findall(r"^\s*from\s+([\w.]+)\s+import", src, re.M))
    third = {m.split(".")[0] for m in imported} - stdlib
    if third == {"yaml"} and "except ImportError" in src:
        continue
    check(not third, f"{script}: non-stdlib imports {sorted(third)}")

# 4. No executable remote pulls in site/admin code ---------------------------
# Content embeds live in data files (excluded); code must not pull scripts,
# stylesheets, fonts, or modules off-site. Bare URL strings (canonical site
# URL, link targets) are fine — only loading patterns are checked.
pull = re.compile(r"<script[^>]+src=\"https?://"
                  r"|<link[^>]+href=\"https?://"
                  r"|@import\s+url\(\s*['\"]?https?://"
                  r"|url\(\s*['\"]?https?://"
                  r"|from\s+['\"]https?://"
                  r"|fetch\(\s*['\"]https?://")
# The pinned CMS bundle is intentional (check 1 enforces its pin).
pinned_cms = re.compile(r"unpkg\.com/@sveltia/cms@\d+\.\d+\.\d+/")
for fp in code_files:
    for i, line in enumerate(open(fp, encoding="utf-8"), 1):
        if pull.search(line) and not pinned_cms.search(line):
            check(False, f"{os.path.relpath(fp, ROOT)}:{i}: "
                         f"remote pull in code: {line.strip()[:90]}")

# 5. Worker stays a static-asset deploy --------------------------------------
# A `main` entry would turn deploys back into SSR builds (see DEPLOY.md).
raw = read("wrangler.jsonc")
stripped = re.sub(r"//.*", "", raw)
wrangler = json.loads(stripped)
check(isinstance(wrangler.get("assets"), dict)
      and wrangler["assets"].get("directory") in ("./dist", "dist"),
      "wrangler.jsonc: assets.directory must point at the static output")
check("main" not in wrangler,
      "wrangler.jsonc: `main` would reintroduce server builds")

if errors:
    print("PIN DRIFT:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print("pins OK: CDN pinned, tooling exact, build stdlib-only, no remote pulls")
