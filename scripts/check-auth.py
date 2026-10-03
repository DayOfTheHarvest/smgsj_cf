#!/usr/bin/env python3
"""Verify auth wiring agrees on one provider.
Run: python3 scripts/check-auth.py (exit 0 = consistent).
The whole login surface is 3 files; this fails the build if they drift."""
import re, sys

errors = []
ts = open('src/config.ts', encoding='utf-8').read()
m = re.search(r"AUTH_PROVIDER:\s*AuthProvider\s*=\s*'([^']+)'", ts)
provider = m.group(1) if m else None
if provider not in ('cloudflare-worker', 'none'):
    errors.append(f'src/config.ts AUTH_PROVIDER unparseable: {provider}')

yml = open('public/admin/config.yml', encoding='utf-8').read()
backend = re.search(r'backend:\s*\n\s*name:\s*([\w-]+)', yml)
backend = backend.group(1) if backend else None
expected_backend = {'cloudflare-worker': 'github'}.get(provider, provider)
if backend != expected_backend:
    errors.append(f'config.yml backend={backend!r} disagrees with AUTH_PROVIDER={provider!r}')
if backend == 'github' and 'base_url:' not in yml:
    errors.append('config.yml backend=github missing base_url (Cloudflare Worker auth URL)')

html = open('public/admin/index.html', encoding='utf-8').read()
has_widget = 'netlify-identity-widget' in html
if has_widget:
    errors.append('admin/index.html still loads Netlify widget for provider ' + str(provider))

if errors:
    print('AUTH DRIFT:')
    for e in errors:
        print(' -', e)
    sys.exit(1)
print(f'auth consistent: provider={provider} backend={backend} widget={has_widget}')
