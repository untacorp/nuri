import { useWordFrequency } from '../hooks/useWordFrequency';

interface WordFrequencyViewProps {
  editor: any;
  activePath: string | null;
}

export default function WordFrequencyView({ editor, activePath }: WordFrequencyViewProps) {
  const wordFrequencies = useWordFrequency(editor, activePath);

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
