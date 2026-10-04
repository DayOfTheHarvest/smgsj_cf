# St. Maria Goretti Parish Website (smgsj.org)

Static trilingual (EN/ES/VI) parish website for St. Maria Goretti Parish,
2980 Senter Road, San Jose CA 95111. Replaces the LPi/WeConnect site with a
fast, staff-editable static site. Content was migrated from a 90-page live
crawl (2026-10-02) plus an August 2026 snapshot; both were removed afterward
to keep the repo lean — `MIGRATION.md` records what came from where.

- **Staff editing guide:** `HANDBOOK.md`
- **Deploy instructions:** `DEPLOY.md`
- **If the web developer volunteer leaves:** `SUCCESSION.md`
- **Old → new page map, gaps, infrastructure notes:** `MIGRATION.md`

## Tech stack (locked)

| Piece | Choice | Notes |
|---|---|---|
| Site generator | Astro 4 (static output, no adapter) | `astro.config.mjs`, `site: https://www.smgsj.org` |
| Styling | Tailwind CSS 3 (`tailwind.config.mjs` + `src/styles/global.css`) | Parish navy/gold tokens; purges to ~26KB |
| CMS | Sveltia CMS 0.227.4, exact-pinned (`public/admin/`) | Sign in with GitHub (OAuth via Cloudflare Worker), no approval flow |
| Content | Markdown (`src/content/pages/*.<locale>.md`) + JSON (`src/data/*.<locale>.json`) | One file per topic per language, EN required, ES/VI optional with fallback banner |
| Markdown rendering | `marked` (`src/lib/md.ts`) | GFM tables |
| Search | Pagefind static index (`dist/pagefind/`) | Built by `npm run build` |
| Hosting | Cloudflare Workers, static assets (`wrangler.jsonc`, no `main`) | `npm run build` → `dist/`; `npx wrangler deploy` uploads it; `public/_redirects` + `public/_headers` ship verbatim (no web forms on site; contact page uses call/email cards) |
| DNS | Network Solutions (domain + DNS, account `webaccount@smgsj.org`) | See `DEPLOY.md` |
| Analytics | None yet (dead placeholder removed from `src/layouts/Base.astro`) | Must work without moving DNS; see `DEPLOY.md §5` |

## Repo map

```
src/pages/index.astro            Root: English homepage served directly (no redirect)
src/pages/[lang]/index.astro     Homepage (carousel, hero, cards, schedule, events, office, flocknote)
src/pages/[lang]/[...slug].astro All 41 topics (body + Mass table / staff cards / forms / etc.)
src/pages/[lang]/staff/[member].astro  13 staff profiles × 3 langs
src/pages/[lang]/search.astro    Pagefind search UI
src/pages/404.astro              Not-found page
src/layouts/Base.astro           Shell: hreflang/canonical, header, notice bar, footer
src/components/                  Header, Footer, MassCards, Carousel,
                                 FlocknoteSignup, HomePage, Icon, PageBlocks
src/content/pages/*.<locale>.md   41 topics × EN/ES/VI: frontmatter (address, title) + body
src/data/*.json                  Schedule, presiders, staff, bulletins, nav, settings,
                                 homepage rows, footer links, office hours, signup form,
                                 notice, UI words
src/data/*.{en,es,vi}.json       Per-language data files (native Sveltia i18n);
                                 missing text falls back to English (see src/lib/i18n.ts)
src/data/ui.*.json               Button/heading wording, 3 languages (Sveltia: Interface words)
public/uploads/                  Local media (headshots, banners, docs <5MB)
public/admin/                    Sveltia CMS (config.yml + index.html)
public/_redirects                74 legacy redirects: old `.html` → `/en/<slug>` (+ staff/photo/contact IDs, news)
scripts/migrate.py               Old-site → Markdown migration (one-off, rerunnable)
scripts/sitemap.py               Post-build sitemap.xml with hreflang alternates
```

## Content model (the 30-second version)

- **Slugs stay English** (`/en/mass-times`, `/es/mass-times`, `/vi/mass-times`).
- Each topic = one file per language (`mass-times.en.md`, `.es.md`, `.vi.md`;
  native Sveltia i18n, `multiple_files`). Empty/missing ES/VI content renders
  English + a small "parts may not be translated" banner (never a 404).
  The address (`slug_key`) is shared by all languages — set once, never change it.
- Repeating/weekly content (Mass times, presiders, bulletins, staff, carousel,
  nav, homepage rows, footer links, office hours, signup form, notice) lives
  in `src/data/*.json`, every file wired to a CMS screen. Shared link logic
  (`resolveLink`, `@giving`/`@youtube`/… aliases) lives in `src/config.ts`.
- Staff never touch `src/components`, `tailwind.config.mjs`, or build/redirect files.

## Local development (verified 2026-10-02, Node v22)

```bash
npm install        # once
npm run dev        # http://localhost:4321 (Astro picks a free port if busy)
npm run build      # pins check + syncs + astro build + sitemap.py + pagefind → dist/ (167 pages)
npm run preview    # serves dist/ locally; add --port 4321 to fix the port
```

What to check after a change: `npm run build` ends with `[build] Complete!`
plus `sitemap.xml: N urls` plus Pagefind `Finished in …`; then load `/en/`,
one `/es/` page, one `/vi/` page, and `/admin/` in preview (all HTTP 200 —
verified list in `DEPLOY.md`).

## Testing

- **Build gate:** `npm run build` must complete with no `ERROR` (it starts
  with `check-pins.py`: pinned CDN/tooling, stdlib-only build scripts, no
  remote pulls in code).
- **Content gate:** `npm run content:check` (41 page addresses × locales, all
  `slug_key` agree).
- **Preview/drift gates:** `python3 scripts/check-preview.py`
  (CMS widgets = shared renderer, identical widget lists, classes, icons),
  plus `sync-shortcuts.py --check` and `sync-icons.py --check` (generated
  references match code).
- **Auth gate:** `npm run auth:check` (provider/backend agree).
- **Smoke:** preview + curl the 9 URLs in `DEPLOY.md §5`.
- **Sandbox acceptance:** bulletin swap + hours fix + new ES paragraph, each
  <5 min in `/admin` on a laptop, per `HANDBOOK.md`.

## Portability

Host-specific pieces are isolated: auth (`AUTH_PROVIDER`), forms
(`FORM_ENDPOINT`), media base (`MEDIA_BASE`) in `src/config.ts`; no
serverless functions/edge code; content is plain Markdown/JSON. Moving hosts
= point DNS + swap those three values (see `DEPLOY.md §7`).
