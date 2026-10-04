// Shared page-section renderer: the SINGLE implementation of the site's
// section/block markup, used by both PageBlocks.astro (site build) and the
// CMS live preview (browser). Framework-free ESM with zero imports apart
// from ./icons.js — every environment difference is injected:
//   md      Markdown text -> HTML string (marked on the site)
//   href    button link -> URL (resolveLink+lang on the site, raw in preview)
//   assetUrl image path -> URL (identity on the site, blob URL in preview)
//   t       microcopy { asof, of, goal, donate } (translated ui on the site)
//   kp      emit data-key-path markers for CMS click-to-highlight (preview)
// public/admin/render-blocks.js is a build-synced copy (scripts/sync-preview.py).
import { ICON_PATHS } from './icons.js?v=2';

// Text nodes: Astro renders ' as &#39;. Attribute values keep ' raw.
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
export { esc };
const escAttr = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function btnClassFor(style) {
  return style === 'gold'
    ? 'btn btn-gold'
    : style === 'primary'
      ? 'btn btn-primary'
      : style === 'outline'
        ? 'btn btn-outline'
        : 'btn btn-light';
}

export function fmtUSD(n) {
  const v = Number(n || 0);
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: v % 1 ? 2 : 0,
  });
}

// Staff directory cards: the canonical implementation used by the site
// (via PageBlocks) and the CMS preview. o: { assetUrl(path)->url,
// profileHref(slug)->url, profileLabel, kp? }. Members without a bio get no button, phone link only.
export function staffInitials(name) {
  return String(name || '')
    .replace(/^(Rev\.|Mrs?\.|Ms\.|Sr\.|Deacon)\s+/i, '')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function renderStaffCards(members, o) {
  return (
    '<div class="cards staff-grid"> ' +
    (Array.isArray(members) ? members : [])
      .map((s, i) => {
        const profile = s.bio
          ? '<p class="my-1"> <a class="btn btn-outline" href="' +
            escAttr(o.profileHref(s.slug)) +
            '">' +
            esc(o.profileLabel) +
            '</a> </p>'
          : '';
        return (
          '<article class="card staff-card"' +
          (o.kp ? ' data-key-path="members.' + i + '" tabindex="0"' : '') +
          '> ' +
          (s.photo
            ? '<img class="staff-photo" src="' +
              escAttr(o.assetUrl(s.photo)) +
              '" alt="' +
              escAttr(s.name) +
              '" width="160" height="160" loading="lazy">'
            : '<span class="staff-initials" aria-hidden="true">' +
              esc(staffInitials(s.name)) +
              '</span>') +
          ' <h3>' +
          esc(s.name) +
          '</h3>' +
          ' <p class="staff-role">' +
          esc(s.role) +
          '</p>' +
          ' <p class="my-1"><a href="tel:' +
          escAttr(String(s.phone || '').replace(/[^0-9]/g, '')) +
          '">' +
          esc(s.phone) +
          '</a></p> ' +
          profile +
          ' </article>'
        );
      })
      .join('') +
    ' </div>'
  );
}

// Office hours text is one "Days: time" line per row in every language.
// Shared so the site, the footer, and the CMS preview parse it identically.
export function parseOfficeHours(text) {
  return String(text || '')
    .split('\n')
    .map((line) => {
      const i = line.indexOf(':');
      return i > 0
        ? { days: line.slice(0, i).trim(), time: line.slice(i + 1).trim() }
        : { days: line.trim(), time: '' };
    })
    .filter((r) => r.days);
}

// Bulletin list. Display label comes from the
// shared date, auto-translated per locale; a hand-typed label wins.
export function bulletinLabel(b, lang) {
  const manual = (b.label || '').trim();
  if (manual) return manual;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(b.date || '');
  if (!m) return b.date || '';
  try {
    return new Intl.DateTimeFormat(lang, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(m[1] + '-' + m[2] + '-' + m[3] + 'T12:00:00Z'));
  } catch (e) {
    return b.date || '';
  }
}

export function filterBulletins(items, weeks, now) {
  const cutoff = weeks > 0 ? now - weeks * 7 * 864e5 : 0;
  return (Array.isArray(items) ? items : []).filter((b) => {
    const t = Date.parse(b.date);
    return Number.isNaN(t) || t >= cutoff;
  });
}

export function renderBulletinList(items, lang, kp) {
  return (
    '<ul class="bulletin-list"> ' +
    items
      .map(
        (b, i) =>
          '<li' +
          (kp ? ' data-key-path="bulletins.' + i + '" tabindex="0"' : '') +
          '><a href="' +
          escAttr(b.url) +
          '">' +
          esc(bulletinLabel(b, lang)) +
          '</a></li>',
      )
      .join('') +
    ' </ul>'
  );
}

export function iconBadge(name) {
  const paths = ICON_PATHS[name] || ICON_PATHS.info;
  return (
    '<span class="icon-badge" aria-hidden="true"><svg width="26" height="26" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    paths +
    '</svg></span>'
  );
}

function buttonAnchor(btn, o) {
  const label = (btn.label || '').trim();
  const link = (btn.link || '').trim();
  if (!label || !link) return '';
  return (
    '<a class="' + btnClassFor(btn.style) + '" href="' + escAttr(o.href(link)) + '">' + esc(label) + '</a>'
  );
}

function renderFundraiser(b, o, kp) {
  const goal = Number(b.goal) || 0;
  if (!b || !goal) return '';
  const pledged = Number(b.pledged) || 0;
  const pct = Math.min(100, (pledged / goal) * 100);
  const label = (b.donate_label || '').trim() || o.t.donate;
  const ariaTitle = (b.title || '').trim() || o.title;
  const center = 'text-align:center';
  return (
    '<section class="my-6 rounded-xl border border-line bg-muted p-5 text-center" style="' +
    center +
    '" aria-label="' +
    escAttr(ariaTitle) +
    '"' +
    (kp ? ' data-key-path="' + kp + '" tabindex="0"' : '') +
    '>' +
    '<p class="my-1 max-w-none text-center text-sm font-bold uppercase tracking-widest text-soft" style="' +
    center +
    '">' +
    esc(o.t.asof) +
    ' ' +
    esc(b.updated || '') +
    '</p>' +
    '<p class="my-1 max-w-none text-center font-serif text-4xl font-bold text-navy" style="' +
    center +
    '">' +
    esc(fmtUSD(pledged)) +
    '</p>' +
    '<div class="mx-auto my-3 h-5 max-w-xl overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow="' +
    String(Math.round(pct * 100) / 100) +
    '" aria-valuemin="0" aria-valuemax="100" aria-label="' +
    escAttr(fmtUSD(pledged) + ' ' + o.t.of + ' ' + fmtUSD(goal) + ' ' + o.t.goal) +
    '">' +
    '<div class="h-full rounded-full" style="width:' +
    pct.toFixed(2) +
    '%;background:linear-gradient(90deg,#a8861c,#c9a227)"></div>' +
    '</div>' +
    '<p class="my-1 max-w-none text-center font-bold text-navy" style="' +
    center +
    '">' +
    pct.toFixed(2) +
    '% ' +
    esc(o.t.of) +
    ' ' +
    esc(fmtUSD(goal)) +
    ' ' +
    esc(o.t.goal) +
    '</p>' +
    (b.donate_link && String(b.donate_link).trim()
      ? '<p class="max-w-none text-center" style="' +
        center +
        '"><a class="btn btn-gold" href="' +
        escAttr(String(b.donate_link).trim()) +
        '">' +
        esc(label) +
        '</a></p>'
      : '') +
    '</section>'
  );
}

export function renderBlock(b, o, kp) {
  if (!b) return '';
  if (b.type === 'fundraiser') return renderFundraiser(b, o, kp);
  if (b.type === 'embed') {
    if (!b.url || !String(b.url).trim()) return '';
    return (
      '<div' +
      (kp ? ' data-key-path="' + kp + '" tabindex="0"' : '') +
      '>' +
      (b.title && String(b.title).trim() ? '<h3>' + esc(b.title) + '</h3>' : '') +
      '<div class="table-scroll" style="border:0">' +
      '<iframe src="' +
      escAttr(String(b.url).trim()) +
      '" title="' +
      escAttr((b.title || '').trim() || o.sectionTitle || o.title) +
      '" width="100%" height="' +
      String(Number(b.height) || 1000) +
      '" loading="lazy"></iframe>' +
      '</div>' +
      (b.caption && String(b.caption).trim()
        ? '<p class="text-sm text-soft">' + esc(b.caption) + '</p>'
        : '') +
      '</div>'
    );
  }
  if (b.type === 'button') {
    const a = buttonAnchor(b, o);
    return a ? '<p>' + a + '</p>' : '';
  }
  if (b.type === 'richtext') {
    const html = b.body && String(b.body).trim() ? o.md(b.body) : '';
    return html ? '<div class="prose">' + html + '</div>' : '';
  }
  if (b.type === 'image') {
    if (!b.image) return '';
    return (
      '<p><img src="' +
      escAttr(o.assetUrl(b.image)) +
      '" alt="' +
      escAttr(b.alt || '') +
      '" loading="lazy" style="border-radius:.75rem"></p>'
    );
  }
  if (b.type === 'staff') {
    if (!o.staff || !o.staff.members) return '';
    return renderStaffCards(o.staff.members, o.staff);
  }
  if (b.type === 'card') {
    // Live cards fill their body from parish data (bulletins, office hours,
    // emergency numbers, contact info) so those sections are generic card
    // rows staff can reorder, rename, or remove. o carries the data:
    // lang, bulletins {items, weeks}, office (hours text), emergencies
    // [{label, number}] (pre-labeled by the caller), contact {phone, email}.
    // Heading, icon, text, image, and buttons still apply around live bodies.
    const kind = b.kind || 'generic';
    const html = b.text && String(b.text).trim() ? o.md(b.text) : '';
    const buttons = (Array.isArray(b.buttons) ? b.buttons : [])
      .map((btn) => buttonAnchor(btn, o))
      .filter(Boolean);
    let live = '';
    if (kind === 'bulletins') {
      const src = o.bulletins;
      const items = src
        ? filterBulletins(src.items || [], Number(src.weeks ?? 3), Date.now()).slice(
            0,
            Number(b.limit ?? 5) || 5,
          )
        : [];
      live = renderBulletinList(items, o.lang || 'en');
    } else if (kind === 'hours' && o.office != null) {
      const rows = parseOfficeHours(o.office);
      live =
        '<dl class="my-2">' +
        rows
          .map(
            (r, i) =>
              '<div class="' +
              (i < rows.length - 1 ? 'border-b border-line py-2' : 'py-2') +
              '">' +
              '<dt class="font-bold text-navy">' +
              esc(r.days) +
              '</dt>' +
              (r.time ? '<dd class="m-0">' + esc(r.time) + '</dd>' : '') +
              '</div>',
          )
          .join('') +
        '</dl>';
    } else if (kind === 'emergency' && o.emergencies) {
      const list = o.emergencies;
      live =
        '<dl class="my-2">' +
        list
          .map(
            (e, i) =>
              '<div class="' +
              (i < list.length - 1 ? 'border-b border-line py-2' : 'py-2') +
              '">' +
              '<dt class="font-bold text-navy">' +
              esc(e.label) +
              '</dt>' +
              '<dd class="m-0"><a class="font-bold" href="tel:' +
              escAttr(String(e.number || '').replace(/[^0-9]/g, '')) +
              '">' +
              esc(e.number) +
              '</a></dd></div>',
          )
          .join('') +
        '</dl>';
    } else if (kind === 'contact' && o.contact) {
      const tel = String(o.contact.phone || '').replace(/[^0-9]/g, '');
      live =
        '<p class="font-serif text-2xl font-bold"><a class="text-navy no-underline" href="tel:' +
        escAttr(tel) +
        '">' +
        esc(o.contact.phone) +
        '</a></p>' +
        '<p class="text-lg font-bold"><a class="text-navy" href="mailto:' +
        escAttr(o.contact.email || '') +
        '">' +
        esc(o.contact.email) +
        '</a></p>';
    } else if (kind !== 'generic') {
      return ''; // live data unavailable (e.g. still loading in preview)
    }
    if (!(b.title && String(b.title).trim()) && !html && !buttons.length && !live && !b.image) return '';
    return (
      '<article class="card"' +
      (kp ? ' data-key-path="' + kp + '" tabindex="0"' : '') +
      '>' +
      (b.icon
        ? '<div class="card-head">' +
          iconBadge(b.icon) +
          '<h3>' +
          esc(b.title || '') +
          '</h3></div>'
        : b.title && String(b.title).trim()
          ? '<h3>' + esc(b.title) + '</h3>'
          : '') +
      (b.image
        ? '<p><img src="' +
          escAttr(o.assetUrl(b.image)) +
          '" alt="' +
          escAttr(b.title || '') +
          '" loading="lazy" style="border-radius:.5rem"></p>'
        : '') +
      (html ? '<div>' + html + '</div>' : '') +
      (live ? '<div>' + live + '</div>' : '') +
      (buttons.length
        ? b.buttons_layout === 'inline'
          ? '<p class="btn-row">' + buttons.join('') + '</p>'
          : buttons.map((a) => '<p>' + a + '</p>').join('')
        : '') +
      '</article>'
    );
  }
  return '';
}

// Group consecutive cards so they render in one grid row, like the
// site-wide card layouts. Other widgets keep their own order around them.
// Cards with no heading, text, or buttons are skipped entirely.
function groupBlocks(blocks) {
  const runs = [];
  const list = Array.isArray(blocks) ? blocks : [];
  list.forEach((b, bi) => {
    if (b && b.type === 'card') {
      const text = b.text && String(b.text).trim() ? 'x' : '';
      const title = b.title && String(b.title).trim() ? 'x' : '';
      // Live cards (bulletins, hours, numbers, contact) render their body
      // from parish data, so they join the grid even with no text of their own.
      const liveKind = b.kind && b.kind !== 'generic';
      if (!(title || text || (b.buttons || []).length || liveKind)) return;
      const last = runs[runs.length - 1];
      if (last && last.kind === 'cards') last.items.push({ b, bi });
      else runs.push({ kind: 'cards', items: [{ b, bi }] });
      return;
    }
    runs.push({ kind: 'single', b, bi });
  });
  return runs;
}

// Render whole page sections. o: { title, md, href, assetUrl, t, kp? }.
// o.title = page title fallback; kp = emit data-key-path markers (preview).
// o.sectionTitle is set per section for embed title fallbacks.
export function renderSections(sections, o) {
  return (Array.isArray(sections) ? sections : [])
    .map((s, si) => {
      const stitle = (s.title || '').trim();
      const bodyHtml = s.body && String(s.body).trim() ? o.md(s.body) : '';
      const so = Object.assign({}, o, { sectionTitle: s.title });
      const kp = o.kp ? (suffix) => 'sections.' + si + suffix : null;
      const inner = groupBlocks(s.blocks)
        .map((run) => {
          if (run.kind === 'cards') {
            const cards = run.items
              .map((it) => renderBlock(it.b, so, kp ? kp('.blocks.' + it.bi) : undefined))
              .filter(Boolean);
            return cards.length ? '<div class="cards">' + cards.join('') + '</div>' : '';
          }
          return renderBlock(run.b, so, kp ? kp('.blocks.' + run.bi) : undefined);
        })
        .join('');
      return (
        '<section aria-label="' +
        escAttr(stitle || o.title) +
        '" class="' +
        (s.type === 'fullwidth_section' ? 'fullwidth' : '') +
        '"' +
        (kp ? ' data-key-path="sections.' + si + '" tabindex="0"' : '') +
        '>' +
        (stitle ? '<h2>' + esc(s.title) + '</h2>' : '') +
        (bodyHtml ? '<div class="prose">' + bodyHtml + '</div>' : '') +
        inner +
        '</section>'
      );
    })
    .join('');
}
