# Succession plan — if the web developer volunteer leaves

Goal: no single person is load-bearing. A new volunteer with basic web skills
should be able to take over using only this file, `README.md`, `DEPLOY.md`,
and the account access below. Review this file once a year (put it on the
parish calendar).

## 1. Account & access inventory (fill in, store a printed copy in the office safe)

Everything must be owned by the **parish**, never by an individual. If any row
still names a person instead of the parish, fix that first.

| Service | Why | Must be owned by | Current holder | Recovery if lost |
|---|---|---|---|---|
| GitHub org + repo | Website source + edit history | Parish org, 2+ owners | ________ | Org owners re-invite; repo can be re-pushed from any clone |
| Cloudflare account (Pages + Worker) | Hosting, builds, `/admin` login backend | Parish, 2+ admins | ________ | Admins re-add members; site rebuilds from GitHub |
| GitHub OAuth app (parish org) | "Sign in with GitHub" at `/admin` | Parish org owners | ________ | Org owners recreate the app, update Worker `GITHUB_CLIENT_ID`/`SECRET` |
| GitHub editors (Write access) | Who can log in to `/admin` | Parish org team | ________ | Org owner adds the member to the team |
| Network Solutions account (`webaccount@smgsj.org`) | `smgsj.org` domain (auto-renew ON) + DNS | Parish, 2+ admins | ________ | Password reset to `webaccount@smgsj.org`; keep that inbox monitored |
| Google/YouTube `@smgsjca` | Stream links, embeds | Parish channel admins | ________ | YouTube Brand-account transfer |
| Facebook page | Footer/contact links | 2+ parish page admins | ________ | Meta Business Suite admin recovery |
| ParishSoft Giving + GiveCentral campaign | Donation/pledge links | Parish office | ________ | Vendor support; links live in Site settings |
| Google account (Forms/Drive) | Baptism, catechetical, facility, marriage-prep forms | Parish office | ________ | Google account recovery; links live in forms list |
| Microsoft account (Forms) | Funeral + certificate request forms | Parish office | ________ | Microsoft account recovery; links live in forms list |
| CalendarWiz `smgsj` | Calendar embeds | Parish login | ________ | Password reset to office email |
| Flocknote group 346213 | Stay-connected signup | Parish login | ________ | Flocknote support |
| Visitor stats (see DEPLOY.md §5) | Token/code snippet | Parish | ________ | Re-issued by the stats provider, one-line change |

Also: `smgsj@smgsj.org` (parish mail) and `webaccount@smgsj.org` (domain/hosting account) must stay **monitored, shared inboxes** — password resets for half the rows above go there.

## 2. What the successor needs to know

- Skills: basic HTML/Markdown, `git`, and `npm` (all documented in
  `README.md` / `DEPLOY.md`). No framework expertise required for routine work.
- First week: log in at `/admin` (Sveltia CMS — Sign in with GitHub), do the sandbox drills in `HANDBOOK.md`,
  run `npm run build` locally, read the open office questions in `MIGRATION.md §3`.
- Standing routine: bulletins + presiders weekly (office staff, no volunteer
  needed); dependency refresh (`npm update`, rebuild) quarterly.

## 3. What breaks if neglected (and how fast)

- Domain renewal lapses → whole site offline. Keep auto-renew + monitored inbox.
- Cloudflare Pages/Workers free-tier limits → effectively never for this traffic; check the
  Cloudflare dashboard email summary.
- `node_modules` rot → rebuild from scratch yearly (`rm -rf node_modules dist .astro && npm install && npm run build`).
- weconnect.com hotlinks (4 bulletins only) die → re-upload those PDFs via Media.

## 4. Emergency contacts (fill in)

- Current web developer volunteer: ________ (phone ________)
- Backup volunteer: ________ (phone ________)
- Pastor approval for sacramental wording: ________
- Office manager (staff editing help): ________
