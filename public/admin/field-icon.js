/* CMS icon picker: a visual grid of parish icons instead of a text dropdown.
   Staff see every icon and click the one they want; the stored value stays a
   plain icon name, so site data, schemas, and previews work untouched.
   Plain browser ESM, no build step: uses the `h` / `createClass` globals
   Sveltia CMS provides (same pattern as preview.js) plus the shared artwork
   (./icons.js, synced from src/lib by scripts/sync-preview.py). The offered
   set comes from each field's own `options` (kept complete by
   scripts/sync-icons.py); unknown stored values still render as a chip so
   nothing is ever lost. */
import { ICON_PATHS } from './icons.js?v=2';

(function () {
  if (!window.CMS || !CMS.registerFieldType) return;

  /* Option names from the field config (Immutable List, array, or missing). */
  function optionNames(field) {
    try {
      var opts = field && field.get ? field.get('options') : field && field.options;
      if (opts && opts.toJS) opts = opts.toJS();
      if (Array.isArray(opts) && opts.length) {
        return opts
          .map(function (o) {
            return typeof o === 'string' ? o : o && (o.value || o.label);
          })
          .filter(Boolean);
      }
    } catch (e) {}
    return Object.keys(ICON_PATHS);
  }

  function iconSvg(name, size) {
    return (
      '<svg width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' +
      ICON_PATHS[name] +
      '</svg>'
    );
  }

  var cellStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 4px',
    background: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '11px',
    lineHeight: '1.2',
    wordBreak: 'break-word',
  };

  var IconControl = createClass({
    render: function () {
      var props = this.props;
      var value = props.value || '';
      var onChange = props.onChange;
      var names = optionNames(props.field);
      // A stored value outside the offered set (e.g. options edited after
      // saving) stays visible and selectable instead of silently vanishing.
      if (value && names.indexOf(value) === -1) names = [value].concat(names);
      var cells = names.map(function (name) {
        var selected = value === name;
        var paths = ICON_PATHS[name];
        return h(
          'button',
          {
            key: name,
            type: 'button',
            title: name,
            'aria-label': 'Icon: ' + name,
            'aria-pressed': selected ? 'true' : 'false',
            onClick: (function (n) {
              return function () {
                onChange(n);
              };
            })(name),
            style: Object.assign({}, cellStyle, {
              border: selected ? '2px solid #1e2e4f' : '2px solid #dfe3ea',
              fontWeight: selected ? '700' : '400',
            }),
          },
          paths
            ? h('span', {
              dangerouslySetInnerHTML: { __html: iconSvg(name, 26) },
            })
            : h(
              'span',
              {
                style: {
                  width: '26px',
                  height: '26px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                },
              },
              '?',
            ),
          h('span', {}, name),
        );
      });
      return h(
        'div',
        { id: props.forID },
        h(
          'div',
          {
            role: 'group',
            'aria-label': 'Choose an icon',
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
              gap: '8px',
            },
          },
          cells,
        ),
        h(
          'button',
          {
            type: 'button',
            onClick: function () {
              onChange('');
            },
            style: {
              marginTop: '8px',
              padding: '6px 12px',
              background: 'transparent',
              border: '2px dashed #dfe3ea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
            },
          },
          value ? 'Remove icon (now: ' + value + ')' : 'No icon',
        ),
      );
    },
  });

  var IconPreview = createClass({
    render: function () {
      var value = this.props.value || '';
      return h(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          },
        },
        ICON_PATHS[value]
          ? h('span', {
            dangerouslySetInnerHTML: { __html: iconSvg(value, 20) },
          })
          : null,
        h('span', {}, value || '(no icon)'),
      );
    },
  });

  CMS.registerFieldType('icon', IconControl, IconPreview);
})();
