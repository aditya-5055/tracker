import { Heading } from '@tiptap/extension-heading';
import { Plugin, PluginKey } from 'prosemirror-state';
import { mergeAttributes } from '@tiptap/core';

function stringToSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { id: attributes.id };
        },
      },
    };
  },

  // FIX: The content hole (0) MUST be the only child.
  // We use CSS ::before pseudo-element to render the anchor icon instead,
  // and wire up the click via a data attribute + global event delegation.
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel ? node.attrs.level : this.options.levels[0];

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-anchor': HTMLAttributes.id || '',
        class: 'heading-anchor-host',
      }),
      0,
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('headingIdPlugin'),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) return;

          const tr = newState.tr;
          let modified = false;
          const usedSlugs = new Set();

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
              const slug = stringToSlug(node.textContent) || `h-${pos}`;
              let finalSlug = slug;
              let counter = 1;
              while (usedSlugs.has(finalSlug)) {
                finalSlug = `${slug}-${counter++}`;
              }
              usedSlugs.add(finalSlug);

              if (node.attrs.id !== finalSlug) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: finalSlug });
                modified = true;
              }
            }
          });

          if (modified) {
            tr.setMeta('addToHistory', false);
            return tr;
          }
        },
      }),
    ];
  },
});
