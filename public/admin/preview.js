/* CMS live preview: renders entries with the parish site's own classes (see
   preview.css) so the preview pane reads like the live page instead of a
   plain markdown dump. Plain script, no build step: uses the `h` /
   `createClass` globals Sveltia CMS provides alongside `window.CMS`.
   Fidelity notes (deliberate): button links render raw (page-path prefixes
   and @aliases resolve at site build); Mass day/service names render in
   English (the stored values); fundraiser microcopy is English; map/calendar
   iframes may refuse framing and show blank until deployed. */

(function () {
  if (!window.CMS) return;

  CMS.registerPreviewStyle('/admin/preview.css');

  /* Inline SVG line icons, copied from src/components/Icon.astro. */
  var ICON_PATHS = {
    news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    form: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    church: '<path d="M12 2v20"/><path d="M8 6h8"/><path d="M5 22h14"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.92 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  };

  function iconBadge(name) {
    return h('span', { className: 'icon-badge', 'aria-hidden': 'true' },
      h('svg', {
        width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        dangerouslySetInnerHTML: { __html: ICON_PATHS[name] || ICON_PATHS.info }
      }));
  }

  function btnClass(s) {
    return s === 'gold' ? 'btn btn-gold'
      : s === 'primary' ? 'btn btn-primary'
      : s === 'outline' ? 'btn btn-outline'
      : 'btn btn-light';
  }

  function buttonAnchor(btn, key) {
    if (!btn || !btn.label || !String(btn.label).trim() ||
        !btn.link || !String(btn.link).trim()) return null;
    return h('a', {
      key: key, className: btnClass(btn.style), href: String(btn.link).trim()
    }, btn.label);
  }

  function fmtUSD(n) {
    return Number(n || 0).toLocaleString('en-US',
      { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 });
  }

  function plain(value) {
    if (value && value.toJS) {
      try { return value.toJS(); } catch (e) { return value; }
    }
    return value;
  }

  function renderBlock(props, b, basePath, key) {
    if (!b) return null;
    var type = b.type;
    if (type === 'fundraiser') {
      var goal = Number(b.goal) || 0;
      if (!goal) return null;
      var pledged = Number(b.pledged) || 0;
      var pct = Math.min(100, (pledged / goal) * 100);
      return h('div', { key: key, className: 'fundraiser', 'data-key-path': basePath, tabIndex: 0 },
        b.title ? h('h3', {}, b.title) : null,
        h('p', { className: 'asof' }, b.updated ? 'Pledged as of ' + b.updated : 'Fundraiser'),
        h('p', { className: 'raised' }, fmtUSD(pledged)),
        h('div', { className: 'bar' },
          h('div', { style: { width: pct.toFixed(2) + '%' } })),
        h('p', { className: 'pct' }, pct.toFixed(2) + '% of ' + fmtUSD(goal)),
        b.donate_link && String(b.donate_link).trim()
          ? h('p', {}, h('a', { className: 'btn btn-gold', href: String(b.donate_link).trim() },
            (b.donate_label && String(b.donate_label).trim()) || 'Donate')) : null);
    }
    if (type === 'embed') {
      if (!b.url || !String(b.url).trim()) return null;
      return h('div', { key: key, 'data-key-path': basePath, tabIndex: 0 },
        b.title ? h('h3', {}, b.title) : null,
        h('div', { className: 'table-scroll', style: { border: 0 } },
          h('iframe', {
            className: 'preview-embed', src: String(b.url).trim(),
            title: b.title || 'Embed', height: Number(b.height) || 1000, loading: 'lazy'
          })),
        b.caption ? h('p', { className: 'text-soft' }, b.caption) : null);
    }
    if (type === 'button') {
      var a = buttonAnchor(b, key);
      return a ? h('p', { key: key }, a) : null;
    }
    if (type === 'richtext') {
      var el = props.widgetFor(basePath + '.body');
      return el ? h('div', { key: key, className: 'prose' }, el) : null;
    }
    if (type === 'image') {
      if (!b.image) return null;
      var asset = props.getAsset ? props.getAsset(b.image) : null;
      return h('p', { key: key },
        h('img', {
          src: (asset && asset.url) || b.image, alt: b.alt || '',
          loading: 'lazy', style: { borderRadius: '.75rem' }
        }));
    }
    if (type === 'card') {
      var kids = [];
      if (b.icon || b.title) {
        kids.push(b.icon
          ? h('div', { className: 'card-head' }, iconBadge(b.icon), h('h3', {}, b.title || ''))
          : (b.title ? h('h3', {}, b.title) : null));
      }
      var textEl = props.widgetFor(basePath + '.text');
      if (textEl) kids.push(h('div', {}, textEl));
      var anchors = (b.buttons || []).map(function (btn, i) {
        return buttonAnchor(btn, 'a' + i);
      }).filter(function (el) { return !!el; });
      if (anchors.length) {
        kids.push(b.buttons_layout === 'inline'
          ? h('p', { className: 'btn-row' }, anchors)
          : h('div', {}, anchors.map(function (el, i) {
            return h('p', { key: 'w' + i }, el);
          })));
      }
      if (!kids.length) return null;
      return h('article', { key: key, className: 'card', 'data-key-path': basePath, tabIndex: 0 }, kids);
    }
    return null;
  }

  /* ---- Pages: title + sections/blocks with the site's own classes ---- */
  var PagesPreview = createClass({
    render: function () {
      var props = this.props;
      var entry = props.entry;
      var title = entry.getIn(['data', 'title']) || '';
      var sections = props.widgetsFor('sections') || [];
      var out = [h('h1', { key: 't', 'data-key-path': 'title', tabIndex: 0 }, title)];
      sections.forEach(function (s, si) {
        var data = s.get('data');
        var widgets = s.get('widgets');
        var stitle = data.get('title');
        var rawBlocks = data.get('blocks');
        var list = (rawBlocks && rawBlocks.forEach) ? rawBlocks : [];
        var kids = [];
        if (stitle) kids.push(h('h2', {
          key: 'h', 'data-key-path': 'sections.' + si + '.title', tabIndex: 0
        }, stitle));
        var bodyEl = widgets.get('body');
        if (bodyEl) kids.push(h('div', {
          key: 'b', className: 'prose', 'data-key-path': 'sections.' + si + '.body'
        }, bodyEl));
        /* Group consecutive cards into one grid row, like the live site. */
        var runs = [];
        list.forEach(function (bv, bi) {
          var b = (bv && bv.toJS) ? bv.toJS() : (bv || {});
          if (b.type !== 'card') { runs.push({ kind: 'single', block: b, bi: bi }); return; }
          var last = runs[runs.length - 1];
          if (last && last.kind === 'cards') last.blocks.push({ b: b, bi: bi });
          else runs.push({ kind: 'cards', blocks: [{ b: b, bi: bi }] });
        });
        runs.forEach(function (run, ri) {
          if (run.kind === 'cards') {
            kids.push(h('div', { key: 'r' + ri, className: 'cards' },
              run.blocks.map(function (item) {
                return renderBlock(props, item.b,
                  'sections.' + si + '.blocks.' + item.bi, 'c' + item.bi);
              })));
          } else {
            var single = renderBlock(props, run.block,
              'sections.' + si + '.blocks.' + run.bi, 's' + ri);
            if (single) kids.push(single);
          }
        });
        out.push(h('section', {
          key: 's' + si,
          'aria-label': stitle || title || 'Section',
          'data-key-path': 'sections.' + si,
          tabIndex: 0
        }, kids));
      });
      return h('div', { className: 'wrap' }, out);
    }
  });

  /* ---- Mass schedule: full table with chips, like /mass-times/ ---- */
  var MassPreview = createClass({
    getInitialState: function () {
      return { langs: [], locs: [] };
    },
    componentDidMount: function () {
      var self = this;
      this.props.getCollection('mass_languages').then(function (entries) {
        self.setState({
          langs: plain(entries).map(function (e) {
            return plain(e.data !== undefined ? e.data : e);
          })
        });
      }, function () {});
      this.props.getCollection('locations').then(function (entries) {
        self.setState({
          locs: plain(entries).map(function (e) {
            return plain(e.data !== undefined ? e.data : e);
          })
        });
      }, function () {});
    },
    render: function () {
      var entry = this.props.entry;
      var rows = plain(entry.getIn(['data', 'masses'])) || [];
      if (!Array.isArray(rows)) rows = [];
      var langs = this.state.langs;
      var locs = this.state.locs;
      function langOf(code) {
        for (var i = 0; i < langs.length; i++) {
          if (langs[i] && langs[i].code === code) return langs[i];
        }
        return {};
      }
      function locName(key) {
        for (var i = 0; i < locs.length; i++) {
          var l = locs[i] || {};
          if (l.key !== key && !(l.en && l.en.key === key)) continue;
          return (l.en && l.en.name) || l.name || key;
        }
        return key;
      }
      return h('div', { className: 'wrap' },
        h('h1', { 'data-key-path': 'masses', tabIndex: 0 }, 'Mass schedule preview'),
        h('div', { className: 'table-scroll' },
          h('table', { className: 'mass' },
            h('thead', {},
              h('tr', {},
                h('th', {}, 'Service'), h('th', {}, 'Day / Time'), h('th', {}, 'Language'),
                h('th', {}, 'Location'), h('th', {}, 'Presider'))),
            h('tbody', {},
              rows.map(function (r, i) {
                var L = langOf(r.lang);
                var chipStyle = L.color
                  ? { backgroundColor: L.color, color: L.text_color || undefined }
                  : undefined;
                return h('tr', { key: i, 'data-key-path': 'masses.' + i, tabIndex: 0 },
                  h('td', {}, r.service),
                  h('td', {}, h('strong', {}, (r.day || '') + ' ' + (r.time || ''))),
                  h('td', {},
                    h('span', { className: 'chip', style: chipStyle }, L.autonym || r.lang)),
                  h('td', {}, locName(r.location)),
                  h('td', {}, (r.presider || '').trim() || 'TBD'));
              })))));
    }
  });

  CMS.registerPreviewTemplate('pages', PagesPreview);
  CMS.registerPreviewTemplate('masses', MassPreview);
})();
