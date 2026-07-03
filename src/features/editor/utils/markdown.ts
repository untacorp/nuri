import TurndownService from 'turndown';
import { marked } from 'marked';

export const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});

// Serialize blockMath back to markdown $$ latex $$
turndownService.addRule('blockMath', {
  filter: (node) => node.nodeName === 'DIV' && node.getAttribute('data-type') === 'block-math',
  replacement: (_content, node) => {
    const latex = (node as HTMLElement).getAttribute('data-latex') || '';
    return `\n\n$$\n${latex}\n$$\n\n`;
  }
});

// Serialize inlineMath back to markdown $ latex $
turndownService.addRule('inlineMath', {
  filter: (node) => node.nodeName === 'SPAN' && node.getAttribute('data-type') === 'inline-math',
  replacement: (_content, node) => {
    const latex = (node as HTMLElement).getAttribute('data-latex') || '';
    return `$${latex}$`;
  }
});

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const parseMarkdown = (content: string) => {
  // Pre-parse block math $$ ... $$ to prevent marked from parsing it as normal text
  let html = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, latex) => {
    const encoded = escapeHtml(latex.trim());
    return `<div data-type="block-math" data-latex="${encoded}"></div>`;
  });

  // Pre-parse inline math $ ... $ (avoiding double dollar matches)
  html = html.replace(/\$([^$\n]+?)\$/g, (_, latex) => {
    const encoded = escapeHtml(latex.trim());
    return `<span data-type="inline-math" data-latex="${encoded}"></span>`;
  });

  return marked.parse(html);
};
