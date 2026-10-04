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
import { renderSections, esc } from './render-blocks.js';

(function () {
  if (!window.CMS) return;

  CMS.registerPreviewStyle('/admin/preview.css');

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

  var PROFILE_LABELS = { en: 'View Profile', es: 'Ver Perfil', vi: 'Xem Hồ Sơ' };

  function staffInitials(name) {
    return String(name || '').replace(/^(Rev\.|Mrs?\.|Ms\.|Sr\.|Deacon)\s+/i, '').split(/\s+/)
      .map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  }

  function bulletinLabel(b, lang) {
    var manual = (b.label || '').trim();
    if (manual) return manual;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(b.date || '');
    if (!m) return b.date || '';
    try {
      return new Intl.DateTimeFormat(lang, {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
      }).format(new Date(m[1] + '-' + m[2] + '-' + m[3] + 'T12:00:00Z'));
    } catch (e) {
      return b.date || '';
    }
  }

  /* ---- Pages: title + sections via the shared site renderer ----
     Staff pages additionally show the member directory below. */
  var PagesPreview = createClass({
    getInitialState: function () {
      return { staff: null };
    },
    componentDidMount: function () {
      var self = this;
      if (this.props.entry.get('slug') !== 'staff') return;
      this.props.getCollection('_singletons', 'staff').then(function (entry) {
        if (Array.isArray(entry)) entry = entry[0];
        var data = entry && (entry.get ? entry.get('data') : entry.data);
        self.setState({ staff: plain(data) });
      }, function () {});
    },
    render: function () {
      var props = this.props;
      var entry = props.entry;
      var raw = entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      var self = this;
      var html =
        '<h1 data-key-path="title" tabindex="0">' + esc(data.title || '') + '</h1>' +
        renderSections(data.sections || [], {
          title: data.title || '',
          md: md,
          href: function (link) { return link; },
          assetUrl: function (p) {
            var a = self.props.getAsset ? self.props.getAsset(p) : null;
            return (a && a.url) || p;
          },
          t: { asof: 'Pledged as of', of: 'of', goal: 'goal', donate: 'Donate' },
          kp: true
        });
      var kids = [h('div', {
        key: 'page', dangerouslySetInnerHTML: { __html: html }
      })];
      var staff = this.state.staff;
      if (entry.get('slug') === 'staff' && staff && staff.members) {
        var loc = previewLocale(entry.get('path'));
        kids.push(h('section', { key: 'dir', 'aria-label': 'Staff directory' },
          h('div', { className: 'staff-grid' },
            staff.members.map(function (m, i) {
              var photo = m.photo && props.getAsset ? props.getAsset(m.photo) : null;
              var tel = String(m.phone || '').replace(/[^0-9]/g, '');
              var bio = m.bio && String(m.bio).trim();
              return h('article', {
                key: i, className: 'card staff-card',
                'data-key-path': 'members.' + i, tabIndex: 0
              },
                photo && photo.url
                  ? h('img', {
                    className: 'staff-photo', src: photo.url, alt: m.name,
                    width: 160, height: 160, loading: 'lazy'
                  })
                  : h('span', { className: 'staff-initials', 'aria-hidden': 'true' },
                    staffInitials(m.name)),
                h('h3', {}, m.name),
                h('p', { className: 'staff-role' }, m.role),
                h('p', { className: 'my-1' },
                  h('a', { href: 'tel:' + tel }, m.phone)),
                bio
                  ? h('p', { className: 'my-1' },
                    h('a', {
                      className: 'btn btn-outline',
                      href: '/' + loc + '/staff/' + m.slug + '/'
                    }, PROFILE_LABELS[loc] || PROFILE_LABELS.en))
                  : null);
            }))));
      }
      return h('div', { className: 'wrap' }, kids);
    }
  });

  /* ---- Header menu singleton: the nav as visitors see it ---- */
  var HeaderPreview = createClass({
    render: function () {
      var raw = this.props.entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      var groups = data.groups || [];
      return h('div', { className: 'wrap' },
        h('h1', { 'data-key-path': 'groups', tabIndex: 0 }, 'Header menu preview'),
        h('nav', { className: 'preview-nav', 'aria-label': 'Primary' },
          groups.map(function (g, i) {
            var kids = (g.children || []).map(function (c, j) {
              return h('li', { key: j },
                h('a', { href: c.href }, c.label));
            });
            return h('div', { key: i },
              h('a', { href: g.href, 'data-key-path': 'groups.' + i + '.label', tabIndex: 0 }, g.label),
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
      var weeks = Number(data.weeks == null ? 3 : data.weeks);
      var cutoff = weeks > 0 ? Date.now() - weeks * 7 * 864e5 : 0;
      var items = (data.bulletins || []).filter(function (b) {
        var t = Date.parse(b.date);
        return Number.isNaN(t) || t >= cutoff;
      }).slice(0, 5);
      return h('div', { className: 'wrap' },
        h('h1', { 'data-key-path': 'bulletins', tabIndex: 0 }, 'Bulletin preview'),
        h('ul', { className: 'bulletin-list' },
          items.map(function (b, i) {
            return h('li', { key: i, 'data-key-path': 'bulletins.' + i, tabIndex: 0 },
              h('a', { href: b.url }, bulletinLabel(b, loc)));
          })));
    }
  });

  /* ---- Mass schedule: full table with chips, like /mass-times/ ----
     (Bespoke: the site's MassCards carries homepage variants + JS filtering
     that don't belong in a shared renderer.) */
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
                var L = langOf(r.lang) || {};
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
  CMS.registerPreviewTemplate('header-menu', HeaderPreview);
  CMS.registerPreviewTemplate('bulletin-list', BulletinPreview);
})();
