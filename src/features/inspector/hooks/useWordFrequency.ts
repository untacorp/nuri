import { useEffect, useState, useMemo } from 'react';
import stopWordsData from '../constants/stopwords.json';

const STOP_WORDS = new Set(stopWordsData);

export function useWordFrequency(editor: any, activePath: string | null) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!editor) return;
    
    let timeoutId: any;
    
    const updateText = () => {
      // Debounce the heavy text extraction and state update by 1 second
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setText(editor.getText());
      }, 1000);
    };
    
    editor.on('transaction', updateText);
    setText(editor.getText()); // initial load
    
    return () => {
      clearTimeout(timeoutId);
      editor.off('transaction', updateText);
    };
  }, [editor, activePath]);

  const wordFrequencies = useMemo(() => {
    if (!text) return [];
    
    // Normalize and split by non-word characters
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      
    const counts: Record<string, number> = {};
    for (const w of words) {
      counts[w] = (counts[w] || 0) + 1;
    }
    
    // Convert to array and sort by frequency (descending)
    const sorted = Object.entries(counts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50
      
    return sorted;
  }, [text]);

  return wordFrequencies;
}
