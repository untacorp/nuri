import { useState } from 'react';
import { PanelRightClose, PanelLeftClose, ArrowLeftRight, Clock, FileText, Activity } from 'lucide-react';
import TimeMachineView from './TimeMachineView';
import WordFrequencyView from './WordFrequencyView';

interface InspectorContentProps {
  activePath: string;
  onClose: () => void;
  onContentSelect: (content: string, hash: string) => void;
  status: string;
  editor: any;
  isRightSide: boolean;
  onToggleSwap: () => void;
}

export default function InspectorContent({ activePath, onClose, onContentSelect, status, editor, isRightSide, onToggleSwap }: InspectorContentProps) {
  const [openSections, setOpenSections] = useState<string[]>(['time-machine']);

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-main shrink-0">
        <div className="flex items-center gap-2 text-text-main">
          <Activity size={16} />
          <h3 className="font-bold text-xs tracking-wider font-mono uppercase">Inspector</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggleSwap} className="p-1.5 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Tukar Posisi Panel">
            <ArrowLeftRight size={14} />
          </button>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-input rounded-none border border-transparent hover:border-border-main transition-colors shrink-0" title="Tutup Inspector">
            {isRightSide ? <PanelRightClose size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>
      </div>
      
      {/* Content / Accordions */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-bg-card">
        {/* Time Machine Section */}
        <div className="border-b border-border-main">
          <button 
            onClick={() => toggleSection('time-machine')}
            className="w-full flex items-center gap-2 p-3 bg-bg-input hover:bg-accent/10 text-text-main transition-colors font-mono text-xs font-bold"
          >
            <Clock size={14} className={openSections.includes('time-machine') ? 'text-accent' : 'text-text-muted'} />
            Time Machine
            <span className="ml-auto text-text-muted font-normal">{openSections.includes('time-machine') ? '▼' : '▶'}</span>
          </button>
          {openSections.includes('time-machine') && (
            <div className="p-0 bg-bg-card">
              <TimeMachineView 
                activePath={activePath} 
                onContentSelect={onContentSelect} 
                status={status} 
              />
            </div>
          )}
        </div>

        {/* Word Frequency Section */}
        <div className="border-b border-border-main">
          <button 
            onClick={() => toggleSection('word-freq')}
            className="w-full flex items-center gap-2 p-3 bg-bg-input hover:bg-accent/10 text-text-main transition-colors font-mono text-xs font-bold"
          >
            <FileText size={14} className={openSections.includes('word-freq') ? 'text-accent' : 'text-text-muted'} />
            Frekuensi Kata
            <span className="ml-auto text-text-muted font-normal">{openSections.includes('word-freq') ? '▼' : '▶'}</span>
          </button>
          {openSections.includes('word-freq') && (
            <div className="p-0 bg-bg-card">
              <WordFrequencyView editor={editor} activePath={activePath} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
