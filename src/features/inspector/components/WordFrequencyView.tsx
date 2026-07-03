import { useEffect, useState, useMemo } from 'react';

interface WordFrequencyViewProps {
  editor: any;
  activePath: string | null;
}

const STOP_WORDS = new Set([
  'dan', 'di', 'ke', 'dari', 'yang', 'itu', 'ini', 'untuk', 'pada', 'dengan', 
  'adalah', 'sebagai', 'tidak', 'akan', 'juga', 'atau', 'dalam', 'bisa', 
  'bahwa', 'karena', 'oleh', 'saat', 'sudah', 'ada', 'mereka', 'dia', 'kita',
  'kami', 'aku', 'kamu', 'saya', 'anda', 'ia', 'lalu', 'seperti', 'kepada',
  'bukan', 'saja', 'telah', 'namun', 'tetapi', 'tapi', 'sementara'
]);

export default function WordFrequencyView({ editor, activePath }: WordFrequencyViewProps) {
  const [text, setText] = useState('');

  // Update whenever editor content changes
  useEffect(() => {
    if (!editor) return;
    
    const updateText = () => {
      setText(editor.getText());
    };
    
    editor.on('transaction', updateText);
    updateText(); // initial load
    
    return () => {
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

  return (
    <div className="flex flex-col border-b border-border-main bg-bg-card max-h-[400px] overflow-y-auto p-3">
      {wordFrequencies.length === 0 ? (
        <div className="text-center text-[10px] text-text-muted font-mono py-4">Belum ada cukup kata.</div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {wordFrequencies.map(({ word, count }) => (
            <div key={word} className="flex items-center justify-between group hover:bg-bg-input px-1.5 py-1 transition-colors rounded-none">
              <span className="text-xs font-mono text-text-main truncate pr-2 group-hover:font-bold">
                {word}
              </span>
              <span className="text-[10px] font-mono text-text-muted shrink-0 flex items-center">
                <span className="opacity-20 mr-2 tracking-widest hidden group-hover:inline-block">......</span>
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
