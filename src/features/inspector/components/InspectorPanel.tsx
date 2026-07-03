import { useState } from 'react';
import { PanelRightClose, ChevronDown, ChevronRight, History, BarChart2 } from 'lucide-react';
import TimeMachineView from './TimeMachineView';
import WordFrequencyView from './WordFrequencyView';

interface InspectorPanelProps {
  activePath: string | null;
  onClose: () => void;
  onContentSelect: (content: string, hash: string) => void;
  status?: string;
  editor: any;
}

export default function InspectorPanel({ activePath, onClose, onContentSelect, status, editor }: InspectorPanelProps) {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    'time-machine': true,
    'word-freq': false
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-80 bg-bg-card border-l border-border-main flex flex-col z-20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-main shrink-0">
        <div className="flex items-center gap-2 text-text-main">
          <h3 className="font-bold text-xs tracking-wider font-mono uppercase">Inspector</h3>
        </div>
        <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-input rounded-none border border-transparent hover:border-border-main transition-colors shrink-0" title="Tutup Inspector">
          <PanelRightClose size={16} className="shrink-0" />
        </button>
      </div>
      
      {/* Scrollable Content (Accordion) */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* TIME MACHINE SECTION */}
        <div className="flex flex-col border-b border-border-main">
          <button 
            onClick={() => toggleSection('time-machine')}
            className="flex items-center gap-2 p-2 bg-bg-input hover:bg-border-main/50 text-text-main transition-colors select-none text-xs font-bold font-mono text-left"
          >
            {openSections['time-machine'] ? <ChevronDown size={14} className="shrink-0"/> : <ChevronRight size={14} className="shrink-0"/>}
            <History size={12} className="shrink-0" />
            <span>TIME MACHINE</span>
          </button>
          {openSections['time-machine'] && (
            <div className="flex flex-col">
              <TimeMachineView 
                activePath={activePath} 
                onContentSelect={onContentSelect} 
                status={status} 
              />
            </div>
          )}
        </div>

        {/* WORD FREQUENCY SECTION */}
        <div className="flex flex-col border-b border-border-main">
          <button 
            onClick={() => toggleSection('word-freq')}
            className="flex items-center gap-2 p-2 bg-bg-input hover:bg-border-main/50 text-text-main transition-colors select-none text-xs font-bold font-mono text-left"
          >
            {openSections['word-freq'] ? <ChevronDown size={14} className="shrink-0"/> : <ChevronRight size={14} className="shrink-0"/>}
            <BarChart2 size={12} className="shrink-0" />
            <span>WORD FREQUENCY</span>
          </button>
          {openSections['word-freq'] && (
            <div className="flex flex-col">
              <WordFrequencyView editor={editor} activePath={activePath} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
