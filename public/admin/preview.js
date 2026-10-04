/* CMS live preview: entries render with the SAME code as the parish site
   (./render-blocks.js, synced from src/lib by scripts/sync-preview.py), so
   the preview pane reads like the live page instead of a plain markdown
   dump. Plain browser ESM, no build step: uses the `h` / `createClass`
   globals Sveltia CMS provides alongside `window.CMS`, plus its `marked` /
   `DOMPurify` globals for Markdown (same { breaks: false } as the site).
   Fidelity notes (deliberate): button links render raw (page-path prefixes
   and @aliases resolve at site build); Mass day/service names render in
   English (the stored values); fundraiser microcopy is English; map/calendar
   iframes may refuse framing and show blank until deployed. */
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

  /* ---- Pages: title + sections via the shared site renderer ---- */
  var PagesPreview = createClass({
    render: function () {
      var props = this.props;
      var entry = props.entry;
      var raw = entry.get('data');
      var data = (raw && raw.toJS) ? raw.toJS() : (raw || {});
      var html =
        '<h1 data-key-path="title" tabindex="0">' + esc(data.title || '') + '</h1>' +
        renderSections(data.sections || [], {
          title: data.title || '',
          md: md,
          href: function (link) { return link; },
          assetUrl: function (p) {
            var a = props.getAsset ? props.getAsset(p) : null;
            return (a && a.url) || p;
          },
          t: { asof: 'Pledged as of', of: 'of', goal: 'goal', donate: 'Donate' },
          kp: true
        });
      return h('div', { className: 'wrap', dangerouslySetInnerHTML: { __html: html } });
    }
  });

  /* ---- Mass schedule: full table with chips, like /mass-times/ ----
     (Bespoke: the site's MassCards carries homepage variants + JS filtering
     that don't belong in a shared renderer.) */
  function plain(value) {
    if (value && value.toJS) {
      try { return value.toJS(); } catch (e) { return value; }
    }
    return value;
  }

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
})();
