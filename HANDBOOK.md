# Parish Website — Office Handbook (laptop only)

**Who is who in this guide:**
- **You / office staff** — the parish employees or volunteers who update words, photos, and
  schedules on the website.
- **Web volunteer** — the technical person who built the site and handles
  anything behind the scenes (logins, design, emergencies). Call this person
  when a step below says so.

**Website address for editing:** `www.smgsj.org/admin`. Sign in with GitHub —
you need a GitHub account with parish access (ask the web volunteer to add
you if you don't have one).
**Use a laptop.** You can look at the website on a phone, but always do your
editing on a laptop.
**Saving puts your change live.** There is no approval step. The website
updates itself about 2 minutes after you save, so check your work on the live
site afterward.

## The one rule

You can freely change **words, photos, and schedules**. Never change anything
marked **"do not change"** (codes, web addresses, time spellings) — those keep
different pages matching each other. Screens with a yellow WARNING box tell
you exactly what can go wrong; read it before saving.

## Every week (each job takes under 5 minutes)

### New Sunday bulletin
1. On the left menu, open **Media** and press Upload. Pick the new bulletin
   file (must be a PDF, smaller than 5 MB). Click the uploaded file and copy
   its address (it looks like `/uploads/20261011B.pdf`).
2. Open **Bulletins**. Add a new row at the TOP of the list: the date, a label
   like "October 11, 2026", and paste the address you copied. The "past N weeks"
   box controls how many show — normally leave it at 3.
3. Save. Check `/en/` on your phone after about 2 minutes. Old bulletins
   disappear from the card on their own by date.

### Who says which Mass (presiders)
Open **Mass schedule & presiders** → Mass times, places & presiders. Update
"Week of" to the coming Sunday, then type each priest's name in that Mass's
row (for example `Fr. Andrew`). Leave it empty if not decided yet. Save —
names appear on the homepage schedule and the Mass times table. Adding a new
place? Type its exact name, then add its translations under Location names.

### Urgent message for everyone (closures, emergencies, holy-day changes)
Open **Notices** → Urgent notice. Write the message in all
3 languages, add a link if there is one, and switch it **ON**. Switch it
**OFF** when it no longer applies — while on, the gold message bar shows on
every page of the site.

## Fixing things

| What you want to change | Where to go in the editing screen |
|---|---|
| Page text (41 topics, English/Spanish/Vietnamese) | Pages → pick the topic, then switch language with the button in the top-right corner. English is required; if Spanish or Vietnamese is empty, visitors see the English with a small note (never a broken page). **New page:** Pages → New Page → set its address once (lowercase-with-dashes), write the English, save — it appears in all 3 languages at once. Then link it from another page. The website itself checks for duplicate addresses — if you made one, the web developer volunteer will see an error and help fix it. |
| Mass times, places, notes | Mass schedule → Mass times, places & presiders. Day, language, and place are picked from lists. Each row also holds that Mass's presider name, so nothing can silently mismatch. |
| Confession wording | Mass schedule → Confession text. Shows beside the Mass schedule. |
| Office hours wording | Parish info → Office hours. Hours update everywhere at once (homepage Contact section, bottom of every page, contact page). |
| Staff names, job titles, phone numbers, biographies | Staff directory. Job titles and biographies in each language — switch top-right; empty shows English. Photos: press Choose image, never type an address. Empty biography = no personal page. |
| Homepage moving pictures | Homepage carousel. The first picture shows on load; each picture has its own seconds and size (leave sizes at 1920×480 unless the web developer volunteer says otherwise). Upload wide pictures (about 1920 wide) under Media first. Captions and alt text in each language — switch top-right; empty shows English. |
| Homepage boxes (Bulletin, Giving, Payment, Requests) | Homepage welcome → the untitled custom row below the banner. Each box is a card: pick Card content per card — Bulletin list (only ONE), Office hours, Emergency numbers, Contact card fill themselves from parish data; Generic card holds your own heading, text, and buttons. Bulletin count lives on the bulletin card. Web addresses for parish pages must start AND end with `/`. You can also type a @shortcut word (@giving, @payment, @calendar-suggest, @calendar-view, @flocknote, @facebook, @youtube) instead of an address — those follow Site settings automatically. |
| Homepage order | Site settings → Homepage welcome → Sections. Drag rows to reorder; uncheck Visible to hide a section (it keeps its place, re-check to show it again). Never change a Theme section's name — only its visibility. |
| Welcome text, buttons, Mass schedule links, events, church icons | Site settings → Homepage welcome (hero banner, schedule block, event cards, Catholic block, custom blocks). Each row carries its own buttons, headings, and extra widgets — relabel or reorder them inside the row. The Contact section is a custom row of live cards (hours, emergency, contact) you can reorder or remove. The pastor's words should stay as he wrote them. |
| Top menu | Site settings → Header menu structure. Links must start AND end with `/`. Add a temporary entry (for example a fundraiser) and remove it when done. |
| Phone, email, address, Giving/Payment, Calendar, YouTube, social media | Site settings → Contact info & external links. A wrong address here shows on every page — double-check. |
| Request forms, photo albums | On the Request Forms / Photo Galleries page itself → Page sections. Update form addresses when yearly sign-ups roll over; paste Google Photos album addresses as albums move over. |
| Fundraisers (capital campaign and future ones) | On the fundraiser page itself → Page widgets → Add “Fundraiser thermometer” and fill goal, raised, date, donate link (and the title + button label in each language via the top-right switcher). New fundraiser: create its page under Pages first, then add its thermometer widget, feature it with a carousel slide. Finished fundraiser: delete the thermometer row, remove its carousel slide, then rewrite the page as a thank-you note — no volunteer needed. |
| Button and heading wording (all 3 languages) | Interface words — one screen for all languages; switch language with the button in the top-right corner. **Wording only — never rename, remove, or add rows**, or text across the site goes blank. |

## Photos and files

**Media** → Upload. Rules of thumb: PDFs under 5 MB, photos under 1 MB,
wide banners about 1920 wide. Big files stay as external links — ask the
web developer volunteer before uploading those. Every upload lands in `/uploads/` — copy its
address into the bulletin list, moving pictures, or page. Big files (weekly
bulletins over 5 MB) stay as links — ask the web developer volunteer before
uploading those.

## What NOT to touch (tell the web developer volunteer)

Page design, colors and fonts, logins, the build settings, redirects,
the Flocknote group address, visitor statistics. If the editing screen shows an
error you do not understand, stop and tell — do not guess.

## If something looks wrong after saving

1. Wait 2–3 minutes (the site needs time to update) and refresh the page
   fully (hold Ctrl and press Shift+R together).
2. Re-open what you edited — most problems are a typo in a web address or a
   changed time or code word.
3. Fix the typo and save again.
4. Still broken → call the web developer volunteer. Tell them the page address and what
   you changed. If your change simply does not show up after 5 minutes, say that —
   the site keeps showing the last good version, so visitors never see a broken page.

## Undo / earlier versions (how it works)
*Things can be undone, but there's effort to undo them, so make sure your changes are correct.*
- **Every save is recorded.** Each save stores who changed what and when.
  Nothing is ever truly lost — even weeks later, any older version can be
  brought back by the web developer volunteer.
- **Whole-site undo (web developer volunteer, 1 click):** every published version of the
  site is kept. The volunteer picks the last good version and puts it live.
  Use this if a change broke many pages at once.
- **Single-page undo (web developer volunteer):** the volunteer finds your change in the
  history and undoes just that save.
- You cannot delete history or other people's changes by accident — saving
  only ever *adds* a new version on top.


## Special-week Mass image + custom homepage blocks
Mass schedule → Mass times: flip Display to Image and pick an uploaded picture
to replace the whole schedule block for a special week (switch back after).
Homepage welcome → Sections → Add “Custom block” where you want it on the page:
freeform cards (picture and/or heading and/or text and/or button).
