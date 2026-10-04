# Deploying smgsj.org (Cloudflare Workers static + GitHub, DNS at Network Solutions)

Target: `https://www.smgsj.org` served from this repo via a Cloudflare Worker
with static assets; DNS stays at Network Solutions. Staff editing is Sveltia
CMS at `/admin` with "Sign in with GitHub" via a parish Cloudflare Worker
(`sveltia-cms-auth`) plus a GitHub OAuth app on the parish org.
If a dashboard label has moved, follow the closest equivalent — the
underlying settings (build command, publish dir, Worker variables,
custom domains) are stable.

## 0. Prereqs (verified)

- Node ≥ 20 and Python 3 (sitemap step).
- A GitHub organization owned by the parish (repo owner = parish, not a volunteer).
- A Cloudflare account owned by the parish; Network Solutions account (`webaccount@smgsj.org`) holding `smgsj.org`.
- The Worker URL (`https://<worker>.workers.dev`) and site Worker name (`<worker>`); `ALLOWED_DOMAINS` = `www.smgsj.org,smgsj.org,<worker>.workers.dev` (+ preview domain if used).

## 1. Push the repo (run once, from this directory)

```bash
git init
git add -A
git commit -m "SMG parish site: Astro 4 + Sveltia, migrated content"
git branch -M main
git remote add origin git@github.com:<PARISH-ORG>/smgsj-site.git
git push -u origin main
```

(`main` because `public/admin/config.yml` sets `branch: main` for the
`github` backend — keep them in sync or logins break.)

## 2. Create the Cloudflare Worker project

1. Cloudflare → **Workers & Pages → Create → Connect to Git** →
   pick `<PARISH-ORG>/smgsj-site`, branch `main`.
2. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy` (uses the pinned local wrangler;
     `wrangler.jsonc` in the repo declares the static-asset Worker, so no
     framework detection runs)
   - Output directory: `dist/`
   - Environment: `NODE_VERSION = 20`
3. Deploy. First build takes ~2–3 min and must end with no `ERROR`.
   Confirm in the deploy log: `[build] Complete!`, `sitemap.xml: N urls`,
   Pagefind `Finished in …`, then `Uploaded <worker>`.
4. Note the preview URL `<worker>.workers.dev` — smoke-test everything
   there before attaching the custom domain (§4–§5).

> Worker deploys: this project ships via `npx wrangler deploy` as a
> static-asset Worker (see the deploy log's `Detected Project Settings`).
> `wrangler.jsonc` is committed on purpose — without it Wrangler mistakes
> the repo for an Astro SSR app, runs `astro add cloudflare`, and pays for
> a second hybrid build on every deploy. `wrangler` and `pagefind` are
> pinned devDependencies so neither is downloaded mid-build. If a future
> deploy log ever shows `astro add cloudflare` or a second `astro build`,
> the committed `wrangler.jsonc` has gone missing — restore it.

## 3. CMS login, forms, redirects/headers (all verified in local `dist/`)

1. **Auth Worker:** deploy `sveltia/sveltia-cms-auth` via its
   "Deploy to Cloudflare Workers" button (or `wrangler deploy`).
   Record the Worker URL `https://<worker>.workers.dev`; its root
   must return OK.
2. **GitHub OAuth app:** parish org → Settings → Developer settings →
   **New OAuth App**:
   - Homepage URL: `https://www.smgsj.org`
   - Authorization callback URL: `https://<worker>.workers.dev/callback`
   - Save the Client ID; generate a Client Secret.
3. **Worker variables:** Worker → Settings → Variables: `GITHUB_CLIENT_ID`,
   encrypted `GITHUB_CLIENT_SECRET`, and `ALLOWED_DOMAINS` from §0.
   Save + redeploy the Worker.
4. **Editors:** each editor needs a GitHub account with **Write** access
   to the repo (parish org team). They log in at
   `https://www.smgsj.org/admin` via "Sign in with GitHub".
   Fill the real org + Worker URL into `public/admin/config.yml`
   (`repo:`, `base_url:`) — placeholders until then.
5. **Forms:** none — the site has no web forms (contact page uses call/email
   cards; signups go to Flocknote/Google/Microsoft externally). Nothing to set up.
6. **Redirects/headers:** `public/_redirects` (74 legacy `.html` → `/en/<slug>`
   301s for staff/photo/contact IDs + `/news/*`, plus `/admin/* → /admin/index.html` 200)
   and `public/_headers` (`/uploads/*` immutable cache) ship verbatim into
   `dist/` — Cloudflare serves both from the output directory.
   Test one after go-live: `/mass-times.html` → `/en/mass-times/`.
7. **Build failure emails:** Worker → Settings → Notifications → add the
   office + volunteer emails for failed deploys. A failed build never takes
   the site down (Cloudflare keeps serving the last good deployment) — the email
   just tells the volunteer a staff save needs attention.

## 4. Custom domain + DNS + SSL

1. Worker → **Custom Domains → Add** `www.smgsj.org` (and add `smgsj.org` →
   redirect to `www`).
2. Network Solutions → `smgsj.org` → **DNS records** (logged in as
   `webaccount@smgsj.org`): follow the dashboard's DNS instructions for a
   zone outside Cloudflare (CNAME toward `<worker>.workers.dev`).
3. SSL: Cloudflare provisions the certificate automatically once DNS
   resolves (Custom Domains shows Active).

## 5. Go-live checklist (run in order)

```bash
npm run build   # gate: ends [build] Complete!, no ERROR
npm run auth:check  # gate: provider/backend/widget agree
```
- [ ] Preview smoke (local): `npx astro preview --port 4321`, then HTTP 200 on
      `/ /en/ /es/mass-times/ /vi/confession/ /admin/`
      `/en/staff/andrew-nguyen/ /sitemap.xml /pagefind/pagefind.js /404.html`
- [ ] Push to `main` → Cloudflare auto-builds and deploys → check the `<worker>.workers.dev` URL.
- [ ] `/mass-times.html` redirects to `/en/mass-times/`.
- [ ] Log in at `/admin` with an editor's GitHub account (not the site owner):
      save a test edit, confirm the commit lands in GitHub and the site rebuilds.
- [ ] Sandbox: bulletin swap + hours fix + ES paragraph, each <5 min on a laptop.
- [ ] Pastor demo sign-off (sacramental ES/VI accuracy, presider names).
- [ ] Switch DNS per §4 during a quiet window; confirm `https://www.smgsj.org/`
      loads with a valid cert and `/admin` still logs in.
- [ ] Decide visitor stats (the old Google Analytics ID is dead): either register the domain for Cloudflare Web Analytics (works without moving nameservers) and paste the snippet where `src/layouts/Base.astro` says so (the dead placeholder loads nothing until then), or drop in a DNS-independent counter. Rebuild + redeploy after.

> Longevity pins (do not loosen without a smoke test): Sveltia CMS is
> exact-pinned in `public/admin/index.html`, `wrangler`/`pagefind` are exact
> in `package.json` with `package-lock.json` committed, and
> `scripts/check-pins.py` (first step of `npm run build`) fails the deploy
> on unpinned CDN URLs, floating tooling, non-stdlib build scripts, remote
> pulls in code, or a non-static Worker config. Upgrading Sveltia means
> bumping the pin, then in `/admin`: log in, edit + save in every
> collection, and check the previews.

## 6. Rollback

Worker → **Deployments** → pick the last good production deployment →
**Retry deployment** (or Rollback). Content edits via Sveltia are git commits —
revert the commit in GitHub to undo. DNS rollback: flip the Network
Solutions record back to the old host. Auth rollback: revert the 3 login
files (`src/config.ts`, `public/admin/index.html`, `public/admin/config.yml`).

## 7. If we ever leave Cloudflare

Only three values change, all in `src/config.ts`: `AUTH_PROVIDER`
(`cloudflare-worker` → new provider), `FORM_ENDPOINT`, `MEDIA_BASE`.
Content (Markdown/JSON), redirects, and all CMS collections move untouched.
Galleries stay external links.

### Replacing staff login (auth switch procedure)

The login surface is exactly 3 files — the public site has zero auth
dependency (`scripts/check-auth.py` / `npm run auth:check` fails if they drift):

| File | Cloudflare today | After switch |
|---|---|---|
| `src/config.ts` | `AUTH_PROVIDER = 'cloudflare-worker'` | new provider id |
| `public/admin/index.html` | Sveltia CMS `<script>` | replacement login snippet |
| `public/admin/config.yml` | `backend: github` + Worker `base_url` | new backend block |

In all cases: run `npm run auth:check`, then `npm run build`, log in at
`/admin` with an editor account, save a test edit, confirm the commit lands in
GitHub and the site rebuilds. Roll back by reverting the 3 files.

## 8. Troubleshooting

| Symptom | Cause → fix |
|---|---|
| `/admin` login loops or "Access denied" | Worker vars wrong (`GITHUB_CLIENT_ID` / encrypted `GITHUB_CLIENT_SECRET` / `ALLOWED_DOMAINS`), OAuth callback URL ≠ `https://<worker>.workers.dev/callback`, `branch:` ≠ repo default, or editor lacks Write access → §3.1–3.4 |
| Worker root not OK | Worker not deployed / env vars missing → redeploy after saving variables |
| Save in Sveltia does nothing | Not logged in with a Write-access GitHub account, or the Worker cannot reach GitHub |
| GitHub login popup blocked | Disable the ad-blocker/popup-blocker for the site, then sign in again; you land in `/admin/` |
| Flocknote signup opens new tab | Expected — posts to Flocknote group 346213 in a new tab |
| Old `.html` URL 404s | Missing `_redirects` rule — add `OLD /en/<slug> 301` |
| Mixed-language page | Normal: missing ES/VI shows English + banner (never 404) |
| Build fails on `marked`/Tailwind | Run `npm install` first; Node ≥ 20 |
