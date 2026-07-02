import TurndownService from 'turndown';
import { marked } from 'marked';

export const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});

export const parseMarkdown = (content) => marked.parse(content);
