# Old site → new site: page map, changes, gaps, infrastructure notes

Sources (since removed to keep the repo lean): a 90-page live crawl (2026-10-02)
plus an August 2026 snapshot, compared against this site (`dist/`, 41 topics ×
3 languages + 39 staff profiles). Every old URL resolves somewhere; this file
says where, what changed, and what still depends on the old world.

Notation: **same** = content carried over; **merged** = folded into another
page; **rebuilt** = restructured with the same information; **dropped** =
intentionally retired; **301** = redirect rule in `public/_redirects`.

## 1. Page-by-page map

| Old URL | New location | Status | Notes |
|---|---|---|---|
| `/` | `/en/ /es/ /vi/` (+ `/` redirect page) | rebuilt | Language splash → auto-redirect by cookie/browser; hero + carousel + cards instead of slider + image-tables |
| `/about-us` | `/en/about-us/` 301 | same | 60-year history verbatim |
| `/meet-our-patron-saint` | `/en/patron-saint/` 301 | same | Full bio incl. Serenelli letter |
| `/photos` | `/en/photos/` 301 | rebuilt | Gallery list kept; dead LPi viewer links removed (albums move to Google Photos links staff paste into the Photo Galleries page itself in Sveltia) |
| `/photos/view/id/*` (7) | `/en/photos/` 301 | merged | Individual galleries retire with the viewer |
| `/about-our-logo` | `/en/logo/` 301 | rebuilt | One-cell table → headed sections; spacing typos fixed |
| `/news`, `/news?page=1..6` | `/en/about-us/` 301 | dropped | Vatican auto-feed (Pope Leo XIV items 10/2026); no parish content lost |
| `/mass-times` | `/en/mass-times/` 301 | rebuilt | 21-row table → real accessible table + presiders + language filter; image-of-text retired |
| `/english`, `/espa-ol`, `/ti-ng-vi-t` | `/en/mass-times/` 301 | merged | Subsets fully contained in the 21-row table |
| `/confession` | `/en/confession/` 301 | same | Trilingual lines kept; genuine ES/VI (no banner) |
| `/request---form` | `/en/requests/` 301 | rebuilt | All 9 forms kept; "Meeting Room (Parishioner Groups only)" label synced; list lives in the Request Forms page's own sections |
| `/sacraments` | `/en/sacraments/` 301 | rebuilt | Link hub rewritten to local pages (was USCCB-only links) |
| `/baptism-bautismo-r-a-t-i` | `/en/baptism/` 301 | same | Trilingual hub + schedule table (delimiter row added — was unparseable) |
| `/baptism-preparation` | `/en/baptism-prep/` 301 | same | EN process intact |
| `/preparaci-n-bautismal` | `/en/baptism-prep/` 301 | **migrated ES** | Was a separate page showing English+fallback; now a genuine Spanish file |
| `/chu-n-b--b--t-ch-r-a-t-i` | `/en/baptism-prep/` 301 | **migrated VI** | Same → genuine Vietnamese file |
| `/confirmation` | `/en/confirmation/` 301 | same | 2-year process text intact |
| `/holy-communion` | `/en/eucharist/` 301 | same | |
| `/reconciliation` | `/en/reconciliation/` 301 | same | Kept conflicting confession times verbatim — open item in §3 below |
| `/anointing-the-sick` | `/en/anointing/` 301 | same | 2311/2310 numbers intact |
| `/marriage-matrimonial-h-n-ph-i` | `/en/marriage/` 301 | same | Fixed broken USCCB excerpt markup; wedding PDFs localized to `/uploads/docs/` |
| `/preparaci-n-matrimonial` | `/en/marriage-prep/` 301 | **migrated ES** | Old page itself is an UNDER CONSTRUCTION stub — carried over verbatim, needs office copy |
| `/chu-n-b--cho-h-n-ph-i` | `/en/marriage-prep/` 301 | **migrated VI** | Was dumped into the English body; now a proper Vietnamese file |
| `/holy-orders` | `/en/orders/` 301 | fixed | Dead `/diaconate` link → Faith Formation page (see §3) |
| `/facility` | `/en/facility/` 301 | same + restored | Walkthrough forms were nav-only and got lost in migration — restored on the page |
| `/today-events` + `/calendar` | `/en/calendar/` 301 | rebuilt | Both iframed embeds live again (day + month views) with reservation button on top |
| `/hall-rental-request-form` | `/en/hall-rental/` 301 | rebuilt | Run-together form fields → readable list; orphan fixed (linked from Join) |
| `/facility-use-agreement` | `/en/facility-agreement/` 301 | same | PDF localized |
| `/formation` | `/en/formation/` 301 | rebuilt | Bare word list → link hub |
| `/glvn` | `/en/glvn/` 301 | **split VI/EN** | Vietnamese section → its own file; internal links rewritten |
| `/sach-book`, `/song-live`, `/phim-video`, `/ph-p-l--th-nh-th----eucharistic-miracles` | `/en/glvn-books|live|video|miracles/` 301 | **split VI/EN** + fixed | Dozens of split-link/emphasis corruptions repaired; `.doc` links localized |
| `/catechetical-ministries` | `/en/catechetical-ministries/` 301 | same | Bold labels → real headings |
| `/breaking-open-the-word--rcia-dismissals-` | `/en/breaking-word/` 301 | same | |
| `/children-s-liturgy-of-the-word` | `/en/children-liturgy/` 301 | same | |
| `/christian-initiation-of-children` | `/en/rcia-children/` 301 | same | |
| `/religious-education-for-children` | `/en/religious-ed-children/` 301 | same | |
| `/rite-of-christian-initiation-of-adults--rcia-` | `/en/rcia/` 301 | same | Empty list item + deco image removed |
| `/ilm` | `/en/ilm/` 301 | same | Bold-fragment soup repaired |
| `/join-us` | `/en/join/` 301 | same | Now links Register + Volunteer (was a dead end) |
| `/new-parishioner-registration---english/spanish/vietnamese` | `/en/register/` 301 | rebuilt | Inline LPi form (unusable statically) → office-process page; no 3 Google forms exist — open item |
| `/volunteer` | `/en/volunteer/` 301 | **split ES/VI** + fixed | Pledge quotes per language; space-broken waiver links repaired |
| `/capital-campaign-` | `/en/campaign/` 301 | rebuilt | Was stub at migration; now full page: hero banner, GiveCentral, 3 booklets, donor list, live thermometer |
| `/contact` | `/en/contact/` 301 | rebuilt | LPi POST form (unusable statically) → call/email/staff cards + map embed + socials; per-person routing retired (single inbox) |
| `/contact/index/id/*` (13) | `/en/contact/` 301 | merged | Map tiles; per-person forms consolidated |
| `/staff/list` | `/en/staff/` 301 | rebuilt | 13 photo cards (6 headshots localized, 7 initial medallions) + 39 profile pages with bios |
| `/staff/view/id/*` (13) | `/en/staff/<name>/` 301 | rebuilt | 3 priest bios migrated; rest were name/role/phone only |
| `/facility` nav extras (Before/After Event Walkthrough) | `/en/facility/` links | **restored** | Were dropped (nav-only links); re-added 2026-10-02 |

## 2. Changes (deliberate, all verified in `dist/`)

- Image-of-text Mass tables → real text (cards + table + filter + presiders).
- Breadcrumb trails, `**` soup, split links, dead viewer/profile/map URLs removed.
- Duplicate headings removed (template renders the title).
- All relative `.html` links rewritten to `/en/<slug>/`.
- Past bulletins audience: 3-week window; old bulletins age out automatically.
- News (Vatican feed) retired; Events section replaces it.

## 3. Still needs fixing / office decisions

1. Reconciliation times conflict (3:30 / 6:30 / 5:00 PM vs 3–4 PM) — kept verbatim, needs sign-off.
2. Mon–Fri 6:00pm Vietnamese Mass in graphics, absent from 21-row table — needs sign-off.
3. Spanish marriage-prep is an upstream stub — needs office copy.
4. No 3 external registration forms exist — register page directs to office; confirm process.
5. `.doc` miracle files + 5 big bulletins stay hotlinked (size/rotation reasons).

## 4. Old-infrastructure dependencies and their fate

| Old dependency | Fate on new site |
|---|---|
| LPi WeConnect CMS/templates/inline styles | Gone (this repo) |
| `uploads.weconnect.com` hotlinks (81 files) | 73 vendored to `/uploads/docs/`; 5 rotating bulletins stay hotlinked by design (see §3 item 5); images/icons/banners localized |
| CalendarWiz iframes (month + day views) | Live again via exact original embed URLs, staff-editable |
| LPi contact POST + per-person routing + CSRF | Retired (needs a server); replaced by call/email/staff cards + single inbox |
| LPi inline registration form | Retired; office-process page (see §3.4) |
| Google Apps Script facility forms | Kept as external links (facility page) |
| ParishSoft Giving/Payment, GiveCentral campaign | Kept as external links (Site settings, `@giving`/`@payment`) |
| Google Scripts/Forms links (baptism, catechetical, marriage-prep) | Kept as external links (Request Forms page sections, Sveltia-managed) |
| Google Maps API-key static image | Replaced by keyless map embed + links |
| Google Translate widget | Replaced by native trilingual pages + switcher |
| Google Tag Manager + `UA-135786317-1` analytics | Removed; nothing loads until a stats decision (see DEPLOY.md §5) |
| Facebook sharer/sharelinks | Dropped; footer + contact social icons instead |
| LPi site search (`/search/results`) | Replaced by Pagefind + `/search` |
| `/diaconate` (404 on old site too) | Points to Formation; needs office URL if a page exists |
| Vatican/USCCB/DSJ icon links | Kept (homepage diocesan block, verified live) |
| EthicsPoint `/manage/design/...` (broken relative URL) | Replaced with verified `opcva.ethicspoint.com` + hotline |
