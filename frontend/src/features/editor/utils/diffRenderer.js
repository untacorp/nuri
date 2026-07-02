import { diffWordsWithSpace } from 'diff';
import { marked } from 'marked';

export const generateDiffHtml = (oldText, newText) => {
  const diff = diffWordsWithSpace(oldText || '', newText || '');
  let diffMarkdown = '';
  
  diff.forEach((part) => {
    // Escape HTML characters in user text to avoid interfering with diff tags
    const cleanValue = part.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (part.added) {
      diffMarkdown += `<span class="bg-diff-added-bg text-diff-added-text px-1">${cleanValue}</span>`;
    } else if (part.removed) {
      diffMarkdown += `<span class="bg-diff-removed-bg text-diff-removed-text px-1">${cleanValue}</span>`;
    } else {
      diffMarkdown += part.value;
    }
  });

  return marked.parse(diffMarkdown);
};


