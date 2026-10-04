/* CMS live preview: entries render with the SAME code as the parish site
   (./render-blocks.js, synced from src/lib by scripts/sync-preview.py), so
   the preview pane reads like the live page instead of a plain markdown
   dump. Plain browser ESM, no build step: uses the `h` / `createClass`
   globals Sveltia CMS provides alongside `window.CMS`, plus its `marked` /
   `DOMPurify` globals for Markdown (same { breaks: false } as the site).
   Fidelity notes (deliberate): button links render raw (page-path prefixes
   and @aliases resolve at site build); Mass day/service names render in
   English (the stored values); fundraiser microcopy is English; map/calendar
   iframes may refuse framing and show blank until deployed; the previewed
   locale is read off the entry file path (falls back to English). */
import { renderSections, renderStaffCards, filterBulletins, renderBulletinList, renderBlock, btnClassFor, iconBadge, esc } from './render-blocks.js?v=2';

(function () {
  if (!window.CMS) return;

  CMS.registerPreviewStyle('/admin/preview.css?v=2');

  function md(src) {
    try {
      return window.DOMPurify.sanitize(window.marked.parse(src || '', { breaks: false }));
    } catch (e) {
      return '';
    }
  }

  function plain(value) {
    if (value && value.toJS) {
      try { return value.toJS(); } catch (e) { return value; }
    }
    return value;
  }

  /* Previewed locale, read off the entry file path (e.g. calendar.es.md);
     the CMS doesn't expose it directly. Falls back to English. */
  function previewLocale(path) {
    var m = /\.(en|es|vi)\./.exec(path || '');
    return m ? m[1] : 'en';
  }

  /* Replicates resolveLink() from src/config.ts so preview links don't 404:
     parish page paths gain the viewing-locale prefix, uploads/admin/files
     pass through, and @aliases resolve against site settings when loaded. */
  function previewHref(link, loc, aliases) {
    var l = String(link || '').trim();
    if (aliases && aliases[l]) return aliases[l];
    if (l.charAt(0) === '/' && l.indexOf('/uploads/') !== 0 && l.indexOf('/admin/') !== 0 &&
        !/\.[a-z0-9]+$/i.test(l.split('?')[0])) {
      return '/' + loc + l;
    }
    return l;
  }

  /* Site settings, fetched once and shared: resolves @giving/@payment/
     @calendar-suggest/@calendar-view/@flocknote/@facebook/@youtube preview links. */
  var SETTINGS_CACHE = null;
  function fetchSettings(props, done) {
    if (SETTINGS_CACHE) { done(SETTINGS_CACHE); return; }
    safeGet(props, 'site', 'settings').then(function (entry) {
      if (Array.isArray(entry)) entry = entry[0];
      var data = entry && (entry.get ? entry.get('data') : entry.data);
      SETTINGS_CACHE = plain(data) || {};
      done(SETTINGS_CACHE);
    }, function () { done({}); });
  }

  function aliasesFrom(settings) {
    if (!settings || !settings.giving) return null;
    return {
      '@giving': settings.giving,
      '@payment': settings.payment,
      '@calendar-suggest': settings.calendar_suggest,
      '@calendar-view': settings.calendar_view,
      '@flocknote': settings.flocknote,
      '@facebook': settings.facebook,
      '@youtube': settings.youtube
    };
  }

  var PROFILE_LABELS = { en: 'View Profile', es: 'Ver Perfil', vi: 'Xem Hồ Sơ' };

  /* True when any button/link in the sections uses an @alias. */
  function sectionsUseAliases(sections) {
    var found = false;
    (sections || []).forEach(function (s) {
      ((s && s.blocks) || []).forEach(function (b) {
        if (!b) return;
        var links = [b.link];
        (b.buttons || []).forEach(function (btn) {
          if (btn && btn.link) links.push(btn.link);
        });
        links.forEach(function (l) {
          if (String(l || '').trim().charAt(0) === '@') found = true;
        });
      });
    });
    return found;
  }

  /* getCollection wrapper: a bad name must never blank a preview. */
  function safeGet(props, a, b) {
    try {
      return props.getCollection(a, b);
    } catch (e) {
      return { then: function (_, eb) { if (eb) eb(e); } };
    }
  }

  /* ---- Pages: title + sections via the shared site renderer ----
     Pages containing a staff widget also show the member directory. */
  function hasStaffWidget(sections) {
    var found = false;
    (sections || []).forEach(function (s) {
      ((s && s.blocks) || []).forEach(function (b) {
        if (b && b.type === 'staff') found = true;
      });
    });
    return found;
  }

  var PagesPreview = createClass({
    getInitialState: function () {
      return { staff: null, aliases: null };
    },
    componentDidMount: function () {
      var self = this;
      var raw = this.props.entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      if (hasStaffWidget(data.sections)) {
        safeGet(this.props, '_singletons', 'staff').then(function (entry) {
          if (Array.isArray(entry)) entry = entry[0];
          var sdata = entry && (entry.get ? entry.get('data') : entry.data);
          self.setState({ staff: plain(sdata) });
        }, function () {});
      }
      if (sectionsUseAliases(data.sections)) {
        fetchSettings(this.props, function (s) {
          self.setState({ aliases: aliasesFrom(s) });
        });
      }
    },
    render: function () {
      var props = this.props;
      var entry = props.entry;
      var raw = entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      var self = this;
      var loc = previewLocale(entry.get('path'));
      var staff = this.state.staff;
      var html =
        '<h1 data-key-path="title" tabindex="0">' + esc(data.title || '') + '</h1>' +
        renderSections(data.sections || [], {
          title: data.title || '',
          md: md,
          href: function (link) { return previewHref(link, loc, self.state.aliases); },
          assetUrl: function (p) {
            var a = self.props.getAsset ? self.props.getAsset(p) : null;
            return (a && a.url) || p;
          },
          t: { asof: 'Pledged as of', of: 'of', goal: 'goal', donate: 'Donate' },
          kp: true,
          staff: staff && staff.members ? {
            members: staff.members,
            assetUrl: function (p) {
              var a = self.props.getAsset ? self.props.getAsset(p) : null;
              return (a && a.url) || p;
            },
            profileHref: function (slug) { return '/' + loc + '/staff/' + slug + '/'; },
            profileLabel: PROFILE_LABELS[loc] || PROFILE_LABELS.en,
            kp: true
          } : null
        });
      return h('div', { className: 'wrap', dangerouslySetInnerHTML: { __html: html } });
    }
  });

  /* Theme-section meanings, mirroring the Homepage Welcome labels in
     public/admin/config.yml. Shown for preset rows (live regions compose
     other collections, so only their place + visibility preview here). */
  var PRESET_INFO = {
    carousel: 'Carousel — rotating banner slides',
    hero: 'Hero — welcome title, subtitle + buttons',
    actions: 'Actions — action cards row',
    schedule: 'Schedule — Mass times + schedule buttons',
    events: 'Events — event cards + calendar buttons',
    body: 'Body — homepage page text',
    office: 'Office — contact + office hours cards',
    flocknote: 'Flocknote — signup form',
    catholic: 'Catholic — diocesan icons + EthicsPoint line'
  };

  function actionBtnExtraClass(s) {
    return s === 'primary' || s === 'gold' || s === 'outline' ? btnClassFor(s) : '';
  }

  /* Shared composed-section renderers: the standalone file previews and the
     full homepage preview render the same elements (no `this` inside the
     list callbacks — plain functions get undefined `this` in modules). */
  function slideFigures(slides, loc, getAsset) {
    return (slides || []).map(function (s, i) {
      var asset = s.image && getAsset ? getAsset(s.image) : null;
      var img = h('img', {
        src: (asset && asset.url) || s.image, alt: s.alt || '',
        loading: 'lazy', style: { borderRadius: '.5rem' }
      });
      return h('figure', { key: i, 'data-key-path': 'slides.' + i, tabIndex: 0 },
        s.link ? h('a', { href: previewHref(s.link, loc, null) }, img) : img,
        h('figcaption', { className: 'text-soft' },
          s.caption || '', s.seconds ? ' (' + s.seconds + 's)' : ''));
    });
  }

  function actionCards(cards, live, aliases, loc, kpBase) {
    var kp = kpBase || 'cards';
    return h('div', { className: 'cards' },
      (cards || []).map(function (c, i) {
        var head = c.icon
          ? h('div', { className: 'card-head' },
            h('span', { dangerouslySetInnerHTML: { __html: iconBadge(c.icon) } }),
            h('h3', {}, c.title || ''))
          : (c.title ? h('h3', {}, c.title) : null);
        var body = null;
        if (c.kind === 'bulletins') {
          body = live ? h('div', {
            dangerouslySetInnerHTML: {
              __html: renderBulletinList(live, loc, true)
            }
          }) : h('p', { className: 'text-soft' }, 'Bulletin list (loading…)');
        } else {
          body = h('div', {},
            c.text ? h('p', {}, c.text) : null,
            c.kind === 'link' && c.link ? h('p', {},
              h('a', {
                className: btnClassFor(c.style),
                href: previewHref(c.link, loc, aliases)
              }, c.link_label || c.title)) : null,
            c.extra_link ? h('p', {},
              h('a', actionBtnExtraClass(c.extra_style)
                ? {
                    className: actionBtnExtraClass(c.extra_style),
                    href: previewHref(c.extra_link, loc, aliases)
                  }
                : { href: previewHref(c.extra_link, loc, aliases) },
                c.extra_label)) : null);
        }
        return h('article', {
          key: i, className: 'card', 'data-key-path': kp + '.' + i, tabIndex: 0
        }, head, body);
      }));
  }

  function langOf(langs, code) {
    for (var i = 0; i < (langs || []).length; i++) {
      if (langs[i] && langs[i].code === code) return langs[i];
    }
    return {};
  }

  function locNameOf(locs, key) {
    for (var i = 0; i < (locs || []).length; i++) {
      var l = locs[i] || {};
      if (l.key !== key && !(l.en && l.en.key === key)) continue;
      return (l.en && l.en.name) || l.name || key;
    }
    return key;
  }

  function massTable(rows, langs, locs) {
    return h('div', { className: 'table-scroll' },
      h('table', { className: 'mass' },
        h('thead', {},
          h('tr', {},
            h('th', {}, 'Service'), h('th', {}, 'Day / Time'), h('th', {}, 'Language'),
            h('th', {}, 'Location'), h('th', {}, 'Presider'))),
        h('tbody', {},
          (rows || []).map(function (r, i) {
            var L = langOf(langs, r.lang) || {};
            var chipStyle = L.color
              ? { backgroundColor: L.color, color: L.text_color || undefined }
              : undefined;
            return h('tr', { key: i, 'data-key-path': 'masses.' + i, tabIndex: 0 },
              h('td', {}, r.service),
              h('td', {}, h('strong', {}, (r.day || '') + ' ' + (r.time || ''))),
              h('td', {},
                h('span', { className: 'chip', style: chipStyle }, L.autonym || r.lang)),
              h('td', {}, locNameOf(locs, r.location)),
              h('td', {}, (r.presider || '').trim() || 'TBD'));
          }))));
  }

  /* ---- Homepage carousel file: the slides as visitors see them ---- */
  var SlidesPreview = createClass({
    render: function () {
      var props = this.props;
      var raw = props.entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      var slides = data.slides || [];
      var loc = previewLocale(props.entry.get('path'));
      var getAsset = function (p) { return props.getAsset ? props.getAsset(p) : null; };
      return h('div', { className: 'wrap' },
        h('h1', { 'data-key-path': 'slides', tabIndex: 0 }, 'Carousel preview'),
        h('p', { className: 'text-soft' }, 'First slide shows on load; slides rotate on the site.'),
        slideFigures(slides, loc, getAsset));
    }
  });

  /* ---- Homepage action cards file: the cards as visitors see them ----
     The bulletin card embeds the live filtered list, like ActionCards. */
  var ActionsPreview = createClass({
    getInitialState: function () {
      return { bulletins: null, aliases: null };
    },
    componentDidMount: function () {
      var self = this;
      safeGet(this.props, 'bulletins', 'bulletin-list').then(function (entry) {
        if (Array.isArray(entry)) entry = entry[0];
        var data = entry && (entry.get ? entry.get('data') : entry.data);
        self.setState({ bulletins: plain(data) });
      }, function () {});
      fetchSettings(this.props, function (s) {
        self.setState({ aliases: aliasesFrom(s) });
      });
    },
    render: function () {
      var data = plain(this.props.entry.get('data')) || {};
      var cards = data.cards || [];
      var bd = this.state.bulletins;
      var aliases = this.state.aliases;
      var loc = previewLocale(this.props.entry.get('path'));
      var limit = Number(data.bulletins_limit == null ? 5 : data.bulletins_limit) || 5;
      var live = bd ? filterBulletins(bd.bulletins || [],
        Number(bd.weeks == null ? 3 : bd.weeks), Date.now()).slice(0, limit) : null;
      return h('div', { className: 'wrap' },
        h('h1', { 'data-key-path': 'cards', tabIndex: 0 }, 'Action cards preview'),
        actionCards(cards, live, aliases, loc, 'cards'));
    }
  });
  var HeaderPreview = createClass({
    getInitialState: function () {
      return { aliases: null };
    },
    componentDidMount: function () {
      var self = this;
      fetchSettings(this.props, function (s) {
        self.setState({ aliases: aliasesFrom(s) });
      });
    },
    render: function () {
      var raw = this.props.entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      var groups = data.groups || [];
      var loc = previewLocale(this.props.entry.get('path'));
      var aliases = this.state.aliases;
      return h('div', { className: 'wrap' },
        h('h1', { 'data-key-path': 'groups', tabIndex: 0 }, 'Header menu preview'),
        h('nav', { className: 'preview-nav', 'aria-label': 'Primary' },
          groups.map(function (g, i) {
            var kids = (g.children || []).map(function (c, j) {
              return h('li', { key: j },
                h('a', { href: previewHref(c.href, loc, aliases) }, c.label));
            });
            return h('div', { key: i },
              h('a', {
                href: previewHref(g.href, loc, aliases),
                'data-key-path': 'groups.' + i + '.label', tabIndex: 0
              }, g.label),
              kids.length ? h('ul', {}, kids) : null);
          })));
    }
  });

  /* ---- Bulletin links file: the list as readers see it ---- */
  var BulletinPreview = createClass({
    render: function () {
      var entry = this.props.entry;
      var raw = entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      var loc = previewLocale(entry.get('path'));
      var items = filterBulletins(
        data.bulletins || [],
        Number(data.weeks == null ? 3 : data.weeks),
        Date.now()
      ).slice(0, 5);
      return h('div', { className: 'wrap' },
        h('h1', {}, 'Bulletin preview'),
        h('div', {
          'data-key-path': 'bulletins',
          dangerouslySetInnerHTML: { __html: renderBulletinList(items, loc, true) }
        }));
    }
  });

  /* ---- Mass schedule: full table with chips, like /mass-times/ ----
     (Bespoke: the site's MassCards carries homepage variants + JS filtering
     that don't belong in a shared renderer.) */
  /* getCollection shapes vary (single entry vs entry-per-item, Immutable vs
     plain), so normalize to a flat item array; unknown shapes resolve to the
     stored codes/keys rather than blank labels. */
  function collectItems(entries) {
    var list = (entries && entries.toJS) ? entries.toJS() : entries;
    if (!list) return [];
    var arr = Array.isArray(list) ? list : [list];
    var out = [];
    arr.forEach(function (e) {
      var d = e;
      if (d && typeof d.get === 'function') {
        try { d = d.get('data'); } catch (err) { d = null; }
      } else if (d && typeof d === 'object' && d.data !== undefined) {
        d = d.data;
      }
      if (d && typeof d.toJS === 'function') {
        try { d = d.toJS(); } catch (err) {}
      }
      if (Array.isArray(d)) out = out.concat(d);
      else if (d && typeof d === 'object') out.push(d);
    });
    return out;
  }

  var MassPreview = createClass({
    getInitialState: function () {
      return { langs: [], locs: [] };
    },
    componentDidMount: function () {
      var self = this;
      safeGet(this.props, 'mass_languages').then(function (entries) {
        self.setState({ langs: collectItems(entries) });
      }, function () {});
      safeGet(this.props, 'locations').then(function (entries) {
        self.setState({ locs: collectItems(entries) });
      }, function () {});
    },
    render: function () {
      var entry = this.props.entry;
      var rows = plain(entry.getIn(['data', 'masses'])) || [];
      if (!Array.isArray(rows)) rows = [];
      return h('div', { className: 'wrap' },
        h('h1', { 'data-key-path': 'masses', tabIndex: 0 }, 'Mass schedule preview'),
        massTable(rows, this.state.langs, this.state.locs));
    }
  });

  /* ---- Homepage welcome file: the whole homepage, in row order ----
     Rows are self-contained (hero/events/catholic carry their own settings);
     theme rows compose live regions from other collections, fetched here.
     Anything still loading (or failing to load) renders as a labeled
     placeholder, so a bad lookup can never blank the preview. */
  var HOMEPAGE_ORDER = ['carousel', 'hero', 'actions', 'schedule', 'events',
    'body', 'office', 'flocknote', 'catholic'];

  /* First entry wins: each getCollection call below resolves one entry. */
  function firstEntry(entry) {
    if (Array.isArray(entry)) entry = entry[0];
    var data = entry && (entry.get ? entry.get('data') : entry.data);
    return plain(data);
  }

  var HomepagePreview = createClass({
    getInitialState: function () {
      return { settings: null, ui: null, actions: null, slides: null,
        bulletins: null, masses: null, langs: [], locs: [],
        confession: null, office: null, signup: null, homeBody: null,
        staff: null };
    },
    componentDidMount: function () {
      var self = this;
      function pull(promise, key, pick) {
        promise.then(function (entry) {
          var patch = {};
          var d = firstEntry(entry);
          patch[key] = pick ? pick(d) : d;
          self.setState(patch);
        }, function () {});
      }
      pull(safeGet(this.props, 'site', 'settings'), 'settings');
      pull(safeGet(this.props, 'interface', 'ui'), 'ui');
      pull(safeGet(this.props, 'homepage', 'action-cards'), 'actions');
      pull(safeGet(this.props, 'homepage', 'slides'), 'slides');
      pull(safeGet(this.props, 'bulletins', 'bulletin-list'), 'bulletins');
      pull(safeGet(this.props, 'schedule', 'masses'), 'masses');
      pull(safeGet(this.props, 'schedule', 'schedule-info'), 'confession',
        function (d) { return (d && d.confession) || null; });
      pull(safeGet(this.props, 'site', 'office-hours'), 'office');
      pull(safeGet(this.props, 'site', 'signup-form'), 'signup');
      pull(safeGet(this.props, '_singletons', 'staff'), 'staff');
      safeGet(this.props, 'mass_languages').then(function (entries) {
        self.setState({ langs: collectItems(entries) });
      }, function () {});
      safeGet(this.props, 'locations').then(function (entries) {
        self.setState({ locs: collectItems(entries) });
      }, function () {});
      safeGet(this.props, 'pages', 'home').then(function (entry) {
        var d = firstEntry(entry) || {};
        self.setState({ homeBody: d.body || null });
      }, function () {});
    },
    render: function () {
      var props = this.props;
      var raw = props.entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      var st = this.state;
      var settings = st.settings || {};
      var ui = st.ui || {};
      var loc = previewLocale(props.entry.get('path'));
      var aliases = aliasesFrom(settings);
      var getAsset = function (p) { return props.getAsset ? props.getAsset(p) : null; };
      var rows = (data.sections && data.sections.length) ? data.sections :
        HOMEPAGE_ORDER.map(function (id) {
          if (id === 'hero') return { type: 'hero', visible: true };
          if (id === 'schedule') return { type: 'schedule', visible: true, buttons: [] };
          if (id === 'events') return { type: 'events', visible: true, events: [], facility: {} };
          if (id === 'catholic') return { type: 'catholic', visible: true, icons: [] };
          return { type: 'preset', id: id, visible: true };
        });
      var bd = st.bulletins;
      var actionLimit = Number(st.actions && st.actions.bulletins_limit == null
        ? 5 : st.actions && st.actions.bulletins_limit) || 5;
      var live = bd ? filterBulletins(bd.bulletins || [],
        Number(bd.weeks == null ? 3 : bd.weeks), Date.now()).slice(0, actionLimit) : null;
      var staffMembers = st.staff && st.staff.members ? st.staff.members : null;
      var staffOpt = staffMembers ? {
        members: staffMembers,
        assetUrl: function (p) { var a = getAsset(p); return (a && a.url) || p; },
        profileHref: function (slug) { return '/' + loc + '/staff/' + slug + '/'; },
        profileLabel: PROFILE_LABELS[loc] || PROFILE_LABELS.en
      } : null;
      function blocksHtml(title, blocks) {
        if (!blocks || !blocks.length) return '';
        // Consecutive buttons share one row, like the site; other widgets
        // render on their own via the shared renderer.
        var out = '';
        var i = 0;
        while (i < blocks.length) {
          var b = blocks[i];
          if (b && b.type === 'button') {
            var anchors = '';
            while (i < blocks.length && blocks[i] && blocks[i].type === 'button') {
              var x = blocks[i++];
              var label = (x.label || '').trim();
              var link = (x.link || '').trim();
              if (label && link) {
                anchors += '<a class="' + btnClassFor(x.style) + '" href="' +
                  esc(previewHref(link, loc, aliases)) + '">' + esc(label) + '</a>';
              }
            }
            if (anchors) out += '<p class="btn-row">' + anchors + '</p>';
          } else {
            out += renderSections(
              [{ type: 'content_section', title: '', body: '', blocks: [blocks[i++]] }],
              {
                title: title, md: md,
                href: function (link) { return previewHref(link, loc, aliases); },
                assetUrl: function (p) { var a = getAsset(p); return (a && a.url) || p; },
                t: { asof: 'Pledged as of', of: 'of', goal: 'goal', donate: 'Donate' },
                staff: staffOpt
              });
          }
        }
        return out;
      }
      function placeholder(si, label, extra) {
        return h('div', {
          key: 's' + si, className: 'preset-row',
          'data-key-path': 'sections.' + si, tabIndex: 0
        },
          h('strong', {}, label),
          extra ? h('span', { className: 'text-soft' }, ' ' + extra) : null);
      }
      function heroNode(s, si) {
        var kp = 'sections.' + si;
        return h('div', { key: 's' + si, className: 'preview-hero', 'data-key-path': kp, tabIndex: 0 },
          s.eyebrow ? h('p', { className: 'hero-eyebrow' }, s.eyebrow) : null,
          h('h1', { 'data-key-path': kp + '.title', tabIndex: 0 }, s.title || ''),
          s.subtitle ? h('p', { 'data-key-path': kp + '.subtitle', tabIndex: 0 }, s.subtitle) : null,
          s.pastor_quote ? h('p', {
            className: 'preview-quote', 'data-key-path': kp + '.pastor_quote', tabIndex: 0
          }, s.pastor_quote) : null,
          h('p', { className: 'btn-row' },
            ((s.buttons || []).map(function (b, i) {
              if (!b.label || !b.link) return null;
              return h('a', {
                key: i, className: 'btn btn-' + (b.style || 'light'),
                href: previewHref(b.link, loc, aliases)
              }, b.label);
            }))));
      }
      function eventsNode(s, si) {
        var kp = 'sections.' + si;
        var heading = s.title || ui.eventsTitle || 'Events';
        var extra = blocksHtml(heading, s.blocks);
        return h('div', { key: 's' + si, 'data-key-path': kp, tabIndex: 0 },
          h('h2', {}, heading),
          h('div', { className: 'cards', 'data-key-path': kp + '.events', tabIndex: 0 },
            ((s.events || [])).map(function (e, i) {
              return h('article', { key: i, className: 'card', 'data-key-path': kp + '.events.' + i, tabIndex: 0 },
                e.icon ? h('div', { className: 'card-head' },
                  h('span', { dangerouslySetInnerHTML: { __html: iconBadge(e.icon) } }),
                  h('h3', {}, e.title || '')) : (e.title ? h('h3', {}, e.title) : null),
                e.text ? h('p', {}, e.text) : null,
                e.link ? h('p', {},
                  h('a', {
                    className: 'btn btn-outline',
                    href: previewHref(e.link, loc, aliases)
                  }, e.link_label || e.title)) : null);
            })),
          extra ? h('div', {
            dangerouslySetInnerHTML: { __html: extra }
          }) : null);
      }
      function catholicNode(s, si) {
        var kp = 'sections.' + si;
        return h('div', { key: 's' + si, 'data-key-path': kp, tabIndex: 0 },
          h('div', {},
            ((s.icons || [])).map(function (ic, i) {
              var asset = ic.image && getAsset(ic.image);
              var img = h('img', {
                className: 'diocesan-icon', src: (asset && asset.url) || ic.image,
                alt: ic.alt || '', loading: 'lazy'
              });
              return ic.link
                ? h('a', { key: i, href: ic.link }, img)
                : h('span', { key: i }, img);
            })),
          h('p', { className: 'text-soft' },
            (s.ethics_name || 'EthicsPoint') + ': ',
            h('a', {
              href: 'tel:' + String(settings.ethicspoint_phone || '').replace(/[^0-9]/g, '')
            }, settings.ethicspoint_phone || ''),
            ' · ',
            h('a', { href: settings.ethicspoint || '#' }, s.ethics_report || '')));
      }
      function customNode(s, si) {
        var extra = blocksHtml(s.title || 'Custom block', s.blocks);
        return h('section', { key: 's' + si, 'aria-label': s.title || 'Custom block' },
          s.title ? h('h2', { 'data-key-path': 'sections.' + si + '.title', tabIndex: 0 }, s.title) : null,
          h('div', { className: 'cards' },
            ((s.cards || [])).map(function (c, ci) {
              var adapted = {
                type: 'card', icon: c.icon, title: c.title, text: c.text,
                image: c.image,
                buttons: c.buttons || (c.link ? [{
                  label: c.link_label || c.title, link: c.link, style: 'outline'
                }] : []),
                buttons_layout: c.buttons_layout
              };
              var inner = renderBlock(adapted, {
                title: s.title || '', md: md,
                href: function (link) { return previewHref(link, loc, aliases); },
                assetUrl: function (p) { var a = getAsset(p); return (a && a.url) || p; },
                t: {}, kp: false
              });
              return h('div', {
                key: ci,
                'data-key-path': 'sections.' + si + '.cards.' + ci,
                dangerouslySetInnerHTML: { __html: inner }
              });
            })),
          extra ? h('div', {
            dangerouslySetInnerHTML: { __html: extra }
          }) : null);
      }
      function scheduleNode(s, si) {
        var m = st.masses;
        if (!m) return placeholder(si, PRESET_INFO.schedule, '(loading…)');
        var rows = m.masses || [];
        var conf = st.confession || {};
        var buttons = ((s && s.buttons) || []).map(function (b) {
          var label = (b.label || '').trim();
          var link = (b.link || '').trim();
          if (!label || !link) return null;
          return h('a', {
            key: label + link,
            className: btnClassFor(b.style) + (b.size === 'large' ? ' px-8 text-lg' : ''),
            href: previewHref(link, loc, aliases)
          }, label);
        });
        return h('div', { key: 's' + si, 'data-key-path': 'sections.' + si, tabIndex: 0 },
          h('h2', {}, (ui.schedule && ui.schedule.massTimes) || 'Mass Times'),
          massTable(rows, st.langs, st.locs),
          (conf.day || conf.time) ? h('p', {},
            h('strong', {}, ((ui.schedule && ui.schedule.confession) || 'Confession') + ': '),
            (conf.day || '') + (conf.day && conf.time ? ' · ' : '') + (conf.time || '')) : null,
          buttons.length ? h('p', { className: 'btn-row' }, buttons) : null);
      }
      function officeNode(si) {
        if (!st.office) return placeholder(si, PRESET_INFO.office, '(loading…)');
        var lines = String(st.office.text || '').split('\n').map(function (line) {
          var i = line.indexOf(':');
          return i > 0
            ? { days: line.slice(0, i).trim(), time: line.slice(i + 1).trim() }
            : { days: line.trim(), time: '' };
        }).filter(function (r) { return r.days; });
        var emergencies = settings.emergencies || [];
        return h('div', { key: 's' + si, 'data-key-path': 'sections.' + si, tabIndex: 0 },
          h('h2', {}, ui.contactSection || 'Contact & Office Hours'),
          h('div', { className: 'cards' },
            h('article', { className: 'card' },
              h('div', { className: 'card-head' },
                h('span', { dangerouslySetInnerHTML: { __html: iconBadge('clock') } }),
                h('h3', {}, (ui.schedule && ui.schedule.office) || 'Office Hours')),
              lines.map(function (r, i) {
                return h('p', { key: i, className: 'my-1' },
                  h('strong', { className: 'text-navy' }, r.days),
                  r.time ? h('span', {}, ' ' + r.time) : null);
              })),
            emergencies.length ? h('article', { className: 'card' },
              h('div', { className: 'card-head' },
                h('span', { dangerouslySetInnerHTML: { __html: iconBadge('alert') } }),
                h('h3', {}, (ui.footer && ui.footer.emergency) || 'Emergency')),
              emergencies.map(function (e, i) {
                var label = e['label_' + loc] || e.label_en || '';
                return h('p', { key: i, className: 'my-1' },
                  h('strong', { className: 'text-navy' }, label),
                  h('br', {}),
                  h('a', { href: 'tel:' + String(e.number || '').replace(/[^0-9]/g, '') }, e.number || ''));
              })) : null,
            h('article', { className: 'card' },
              h('div', { className: 'card-head' },
                h('span', { dangerouslySetInnerHTML: { __html: iconBadge('phone') } }),
                h('h3', {}, ui.contactCard || 'Get in Touch')),
              settings.phone ? h('p', { className: 'my-1' },
                h('a', { href: 'tel:' + String(settings.phone).replace(/[^0-9]/g, '') }, settings.phone)) : null,
              settings.email ? h('p', { className: 'my-1' },
                h('a', { href: 'mailto:' + settings.email }, settings.email)) : null)));
      }
      function flocknoteNode(si) {
        var f = st.signup;
        if (!f) return placeholder(si, PRESET_INFO.flocknote, '(loading…)');
        return h('div', { key: 's' + si, 'data-key-path': 'sections.' + si, tabIndex: 0 },
          h('h2', {}, f.title || 'Stay Connected'),
          f.text ? h('p', {}, f.text) : null,
          h('form', { action: f.action || '#', method: f.method || 'post', target: f.target || '_blank' },
            ((f.fields || [])).map(function (fd, i) {
              if (!fd || !fd.name) return null;
              if (fd.type === 'hidden') {
                return h('input', { key: i, name: fd.name, type: 'hidden', value: fd.value || '' });
              }
              return h('p', { key: i, className: 'my-1' },
                h('label', {},
                  fd.label || fd.name,
                  h('br', {}),
                  fd.type === 'checkbox'
                    ? h('input', { name: fd.name, type: 'checkbox', value: fd.value || 'yes', required: !!fd.required })
                    : h('input', {
                      name: fd.name, type: fd.type || 'text',
                      placeholder: fd.label || '', required: !!fd.required
                    })));
            }),
            h('p', {},
              h('button', { className: 'btn btn-gold', type: 'submit' }, f.submit_label || 'Sign Up'))));
      }
      var kids = rows.map(function (s, si) {
        if (!s) return null;
        if (s.type === 'hero') {
          return s.visible === false ? null : heroNode(s, si);
        }
        if (s.type === 'events') {
          return s.visible === false ? null : eventsNode(s, si);
        }
        if (s.type === 'schedule') {
          return s.visible === false ? null : scheduleNode(s, si);
        }
        if (s.type === 'catholic') {
          return s.visible === false ? null : catholicNode(s, si);
        }
        if (s.type === 'custom') {
          return customNode(s, si);
        }
        if (s.type === 'preset' && s.visible !== false) {
          if (s.id === 'carousel') {
            return st.slides
              ? h('div', { key: 's' + si, 'data-key-path': 'sections.' + si, tabIndex: 0 },
                slideFigures(st.slides.slides || [], loc, getAsset))
              : placeholder(si, PRESET_INFO.carousel, '(loading…)');
          }
          if (s.id === 'actions') {
            return st.actions
              ? h('div', { key: 's' + si, 'data-key-path': 'sections.' + si, tabIndex: 0 },
                actionCards(st.actions.cards || [], live, aliases, loc, 'sections.' + si + '.cards'))
              : placeholder(si, PRESET_INFO.actions, '(loading…)');
          }
          if (s.id === 'body') {
            return st.homeBody
              ? h('div', {
                key: 's' + si, className: 'prose',
                'data-key-path': 'sections.' + si, tabIndex: 0,
                dangerouslySetInnerHTML: { __html: md(st.homeBody) }
              })
              : placeholder(si, PRESET_INFO.body, '(page text lives on the Home topic page)');
          }
          if (s.id === 'office') return officeNode(si);
          if (s.id === 'flocknote') return flocknoteNode(si);
          return placeholder(si, PRESET_INFO[s.id] || s.id);
        }
        return null;
      });
      return h('div', { className: 'wrap' }, kids);
    }
  });


  CMS.registerPreviewTemplate('pages', PagesPreview);
  CMS.registerPreviewTemplate('homepage-text', HomepagePreview);
  CMS.registerPreviewTemplate('action-cards', ActionsPreview);
  CMS.registerPreviewTemplate('slides', SlidesPreview);
  CMS.registerPreviewTemplate('masses', MassPreview);
  CMS.registerPreviewTemplate('header-menu', HeaderPreview);
  CMS.registerPreviewTemplate('bulletin-list', BulletinPreview);
})();
