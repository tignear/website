import { createHash } from 'node:crypto';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { D2 } from '@d2lang/d2';
import { defineMdastPlugin } from 'satteri';
import { optimize } from 'svgo';

const theme = `
vars: {
  d2-config: {
    layout-engine: elk
    theme-id: 0
    dark-theme-id: 200
    pad: 24
    theme-overrides: {
      N1: "#27233a"
      N2: "#514a68"
      N3: "#6c687d"
      N4: "#c5bdd8"
      N5: "#e7e0f3"
      N6: "#efebf6"
      N7: "#f7f5fb"
      B1: "#7265ad"
      B2: "#9385c2"
      B3: "#e7e0f3"
      B4: "#4d9e9a"
      B5: "#a9d3cf"
      B6: "#e0efed"
    }
    dark-theme-overrides: {
      N1: "#f3eff8"
      N2: "#d5cde6"
      N3: "#aaa4bb"
      N4: "#635a78"
      N5: "#37304c"
      N6: "#252031"
      N7: "#171522"
      B1: "#b4a7e6"
      B2: "#9788c8"
      B3: "#37304c"
      B4: "#7fc9c2"
      B5: "#477e7b"
      B6: "#233b3b"
    }
  }
}
`;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

async function renderDiagram(source: string, salt: string) {
  const d2 = new D2();
  try {
    // Separate virtual files keep D2 errors relative to the author's source.
    const result = await d2.compile({
      fs: {
        'index.d2': '...@theme.d2\n...@diagram.d2',
        'theme.d2': theme,
        'diagram.d2': source,
      },
      inputPath: 'index.d2',
    });
    const svg = await d2.render(result.diagram, {
      ...result.renderOptions,
      salt,
      noXMLTag: true,
      scale: 1,
    });
    // D2 also emits unscoped classes such as .md and .light-code.
    // Prefix both their CSS selectors and SVG attributes before inlining.
    return optimize(svg, {
      plugins: [{ name: 'prefixIds', params: { prefix: salt } }],
    }).data;
  } finally {
    // The WASM worker must be released even when a diagram fails to compile.
    await d2.dispose();
  }
}

export function d2Diagrams() {
  return defineMdastPlugin({
    name: 'd2-diagrams',
    options: { position: true },
    async code(node, context) {
      if (node.lang?.toLowerCase() !== 'd2') return;

      const file = context.fileURL ? relative(process.cwd(), fileURLToPath(context.fileURL)) : 'Markdown';
      const line = node.position?.start.line ?? 1;
      const id = `diagram-${createHash('sha256').update(`${file}:${line}:${node.value}`).digest('hex').slice(0, 12)}`;
      const caption = node.meta?.trim() ?? '';
      const label = escapeHtml(caption || '構成図');

      let svg: string;
      try {
        svg = await renderDiagram(node.value, id);
      } catch (cause) {
        throw new Error(`D2 diagram could not be rendered (${file}:${line}):\n${cause instanceof Error ? cause.message : String(cause)}`, { cause });
      }

      svg = svg.replace('<svg ', `<svg role="img" aria-labelledby="${id}-title" `)
        .replace(/<svg\b[^>]*>/, (openingTag) => `${openingTag}<title id="${id}-title">${label}</title>`);

      return {
        type: 'html',
        value: `<figure class="diagram"><div class="diagram-scroll" tabindex="0" role="group" aria-label="${label}">${svg}</div>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`,
      };
    },
  });
}
