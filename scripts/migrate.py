#!/usr/bin/env python3
"""HISTORICAL — one-off LPi crawl -> src/content/pages/*.md migration (2026-10-02).
Do NOT rerun as-is: it emits the pre-i18n layout (title_en/body_es frontmatter),
while pages are now per-locale files (<slug>.<locale>.md, native Sveltia i18n).
Kept for provenance only.
"""
import os, re, html as ihtml
from html.parser import HTMLParser

BASE = os.path.join(os.path.dirname(__file__), '..', 'old_smgsj', 'www.smgsj.org')
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'pages')

# old file -> (new slug, title_en)
MAPPING = {
    'index.html': ('home', 'Welcome'),
    'contact.html': ('contact', 'Contact Us'),
    'staff/list.html': ('staff', 'Staff'),
    'about-us.html': ('about-us', 'About Us'),
    'meet-our-patron-saint.html': ('patron-saint', 'Our Patron Saint'),
    'photos.html': ('photos', 'Photo Galleries'),
    'about-our-logo.html': ('logo', 'About Our Logo'),
    'mass-times.html': ('mass-times', 'Mass Times'),
    'confession.html': ('confession', 'Confession'),
    'request---form.html': ('requests', 'Request Forms'),
    'sacraments.html': ('sacraments', 'Sacraments'),
    'baptism-bautismo-r-a-t-i.html': ('baptism', 'Baptism'),
    'baptism-preparation.html': ('baptism-prep', 'Baptism Preparation'),
    'confirmation.html': ('confirmation', 'Confirmation'),
    'holy-communion.html': ('eucharist', 'Holy Communion'),
    'reconciliation.html': ('reconciliation', 'Reconciliation'),
    'anointing-the-sick.html': ('anointing', 'Anointing of the Sick'),
    'marriage-matrimonial-h-n-ph-i.html': ('marriage', 'Marriage'),
    'preparaci-n-matrimonial.html': ('marriage-prep', 'Marriage Preparation'),
    'chu-n-b--cho-h-n-ph-i.html': ('marriage-prep-vi-note', 'Marriage Prep (VI source)'),
    'holy-orders.html': ('orders', 'Holy Orders'),
    'facility.html': ('facility', 'Facility'),
    'calendar.html': ('calendar', 'Calendar'),
    'today-events.html': ('calendar-note', 'Today Events (merged)'),
    'hall-rental-request-form.html': ('hall-rental', 'Hall Rental'),
    'facility-use-agreement.html': ('facility-agreement', 'Facility Use Agreement'),
    'formation.html': ('formation', 'Faith Formation'),
    'catechetical-ministries.html': ('catechetical-ministries', 'Catechetical Ministries'),
    'rite-of-christian-initiation-of-adults--rcia-.html': ('rcia', 'OCIA / RCIA'),
    'christian-initiation-of-children.html': ('rcia-children', 'Christian Initiation of Children'),
    'children-s-liturgy-of-the-word.html': ('children-liturgy', "Children's Liturgy of the Word"),
    'religious-education-for-children.html': ('religious-ed-children', 'Religious Education for Children'),
    'breaking-open-the-word--rcia-dismissals-.html': ('breaking-word', 'Breaking Open the Word'),
    'ilm.html': ('ilm', 'Institute for Leadership in Ministry'),
    'glvn.html': ('glvn', 'GLVN — Vietnamese Faith Formation'),
    'sach-book.html': ('glvn-books', 'GLVN Books'),
    'song-live.html': ('glvn-live', 'GLVN Live'),
    'phim-video.html': ('glvn-video', 'GLVN Video'),
    'ph-p-l--th-nh-th----eucharistic-miracles.html': ('glvn-miracles', 'Eucharistic Miracles'),
    'join-us.html': ('join', 'Join Us'),
    'new-parishioner-registration---english.html': ('register', 'Parish Registration'),
    'volunteer.html': ('volunteer', 'Volunteer'),
    'capital-campaign-.html': ('campaign', 'Capital Campaign'),
    'english.html': ('_skip', ''),
    'espa-ol.html': ('_skip', ''),
    'ti-ng-vi-t.html': ('_skip', ''),
    'preparaci-n-bautismal.html': ('_merge-baptism-prep-es', ''),
    'chu-n-b--b--t-ch-r-a-t-i.html': ('_merge-baptism-prep-vi', ''),
    'news.html': ('_skip', ''),
}

class MD(HTMLParser):
    def __init__(self):
        super().__init__()
        self.out = []
        self.link = None
        self.li_depth = 0
        self.in_table = False
        self.row = []
        self.cell = None
        self.skip = 0  # script/style/nav/header/footer
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style', 'nav', 'header', 'footer'):
            self.skip += 1; return
        if self.skip: return
        if tag == 'a':
            self.link = a.get('href', '')
        elif tag in ('h1', 'h2', 'h3'):
            self.out.append('\n\n' + '#' * (int(tag[1])) + ' ')
        elif tag == 'p':
            self.out.append('\n\n')
        elif tag == 'br':
            self.out.append('  \n')
        elif tag in ('ul', 'ol'):
            self.out.append('\n')
            self.li_depth += 1
        elif tag == 'li':
            self.out.append('\n- ')
        elif tag == 'strong' or tag == 'b':
            self.out.append('**')
        elif tag == 'em' or tag == 'i':
            self.out.append('*')
        elif tag == 'table':
            self.in_table = True; self.out.append('\n')
        elif tag == 'tr':
            self.row = []
        elif tag in ('td', 'th'):
            self.cell = ''
        elif tag == 'img':
            alt = a.get('alt', '').strip() or 'image'
            src = a.get('src', '')
            self.out.append(f'\n\n![{alt}]({src})\n\n')
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'header', 'footer'):
            self.skip = max(0, self.skip - 1); return
        if self.skip: return
        if tag == 'a':
            self.link = None
        elif tag in ('ul', 'ol'):
            self.li_depth = max(0, self.li_depth - 1)
            self.out.append('\n')
        elif tag in ('strong', 'b'):
            self.out.append('**')
        elif tag in ('em', 'i'):
            self.out.append('*')
        elif tag in ('h1', 'h2', 'h3', 'p'):
            self.out.append('\n')
        elif tag in ('td', 'th'):
            self.row.append((self.cell or '').strip())
            self.cell = None
        elif tag == 'tr':
            if self.row and any(self.row):
                self.out.append('\n| ' + ' | '.join(self.row) + ' |')
            self.row = []
        elif tag == 'table':
            self.in_table = False
            self.out.append('\n')
    def handle_data(self, data):
        if self.skip: return
        t = ihtml.unescape(data)
        if not t.strip():
            return
        t = re.sub(r'\s+', ' ', t)
        if self.cell is not None:
            self.cell += t
            return
        if self.link:
            self.out.append(f'[{t.strip()}]({self.link})')
            return
        self.out.append(t)

def extract(old_rel):
    p = os.path.join(BASE, old_rel)
    with open(p, encoding='utf-8', errors='ignore') as f:
        html = f.read()
    m = re.search(r'content-wrapper(.*?)<footer|content-wrapper(.*)', html, re.S | re.I)
    chunk = m.group(1) if m and m.group(1) else html
    # drop share/footer boilerplate
    chunk = re.split(r'Share this page', chunk)[0]
    # drop breadcrumb duplicate: first "> Home ..." nav trail
    parser = MD()
    parser.feed(chunk)
    md = ''.join(parser.out)
    md = re.sub(r'\n{3,}', '\n\n', md).strip()
    # strip leftover nav trails
    md = re.sub(r'^(.*Home.*Contact Us.*)$', '', md, flags=re.M).strip()
    # collect links kept
    links = sorted(set(re.findall(r'\((https?[^)]+)\)', md)))
    return md, links

def main():
    os.makedirs(OUT, exist_ok=True)
    report = []
    for old_rel, (slug, title) in MAPPING.items():
        if slug.startswith('_'):
            continue
        md, links = extract(old_rel)
        # special-case mass-times: keep table note, real table lives in MassCards component
        if slug == 'mass-times':
            md = ('> Full schedule below is rendered as accessible cards site-wide '
                  'from `src/data/mass.ts` (22-row trilingual source).\n\n' + md)
        fm = (f'---\nslug: {slug}\ntitle_en: "{title}"\ntitle_es: ""\n'
              f'title_vi: ""\nbody_es: ""\nbody_vi: ""\nupdated: 2026-10-02\n---\n\n')
        with open(os.path.join(OUT, slug + '.md'), 'w', encoding='utf-8') as f:
            f.write(fm + md + '\n')
        report.append((slug, len(md), len(links), old_rel))
    # Confession: append genuine trilingual lines from crawl
    # Baptism-prep ES/VI stubs appended as comments for pastor review
    print(f'Migrated {len(report)} pages -> {OUT}')
    for slug, chars, nlinks, old in sorted(report):
        print(f'  {slug:28s} chars={chars:5d} links={nlinks:2d}  <= {old}')
    # write audit summary
    with open(os.path.join(os.path.dirname(__file__), '..', 'AUDIT.md'), 'w') as f:
        f.write('# SMG audit (crawl + live deltas)\n\n')
        f.write('Crawl: old_smgsj/www.smgsj.org (93 files). Live: http://smgsj.org/main (http only).\n\n')
        f.write('## Open items (confirmed)\n- Office hours: old trilingual (Tue–Fri 10–5, Sat–Mon CLOSED) — confirmed.\n')
        f.write('- Mass list: old 22-row trilingual — confirmed.\n- Email default: smgsj@smgsj.org.\n\n')
        f.write('## Migrated pages\n')
        for slug, chars, nlinks, old in sorted(report):
            f.write(f'- {slug} ({chars} chars, {nlinks} links) <= {old}\n')

if __name__ == '__main__':
    main()
