import { useState, useEffect, useCallback } from 'react';
import { GitCommit, Clock, RefreshCw } from 'lucide-react';
import { fetchHistory, fetchHistoryContent } from '~/features/editor/services/api';

interface Commit {
  hash: string;
  message: string;
  date: string;
}

interface TimeMachineViewProps {
  activePath: string | null;
  onContentSelect: (content: string, hash: string) => void;
  status?: string;
}

export default function TimeMachineView({ activePath, onContentSelect, status }: TimeMachineViewProps) {
  const [history, setHistory] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  
  const loadHistory = useCallback(() => {
    if (activePath) {
      setLoading(true);
      fetchHistory(activePath).then(data => {
        setHistory(data.history || []);
        setLoading(false);
      });
    }
  }, [activePath]);

  useEffect(() => {
    loadHistory();
    setSelectedHash(null);
  }, [activePath, loadHistory]);

  useEffect(() => {
    if (status === 'Synced') {
      loadHistory();
    }
  }, [status, loadHistory]);

  const handleViewCommit = (hash: string) => {
    if (!activePath) return;
    setSelectedHash(hash);
    fetchHistoryContent(activePath, hash).then(data => {
      onContentSelect(data.content, hash);
    });
  };

  return (
    <div className="flex flex-col border-b border-border-main">
      <div className="p-3 bg-bg-card flex justify-between items-center border-b border-border-main">
        <p className="text-[10px] font-mono text-text-muted leading-relaxed">
          Otomatis merekam jejak tulisan.
        </p>
        <button onClick={loadHistory} className="p-1 text-text-muted hover:text-text-main shrink-0 border border-transparent hover:border-border-main rounded-none">
          <RefreshCw size={12} className={loading ? "animate-spin shrink-0" : "shrink-0"} />
        </button>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-2 max-h-[400px] overflow-y-auto bg-bg-card">
        {history.length === 0 && !loading && (
          <div className="text-center text-[10px] text-text-muted font-mono py-4">Belum ada riwayat.</div>
        )}
        
        {history.map((commit) => {
          const date = new Date(commit.date);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateString = date.toLocaleDateString();
          const isSelected = selectedHash === commit.hash;
          
          return (
            <div 
              key={commit.hash}
              onClick={() => handleViewCommit(commit.hash)}
              className={`p-2.5 rounded-none border cursor-pointer transition-colors ${
                isSelected 
                  ? 'border-text-main bg-bg-input font-bold' 
                  : 'border-border-main hover:border-text-main bg-bg-card'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <GitCommit size={12} className={`shrink-0 ${isSelected ? 'text-text-main' : 'text-text-muted'}`} />
                <span className="text-[9px] font-mono text-text-muted">{commit.hash.substring(0, 7)}</span>
              </div>
              <p className={`text-[11px] font-mono mb-2 leading-snug ${isSelected ? 'text-text-main font-bold' : 'text-text-muted'}`}>
                {commit.message}
              </p>
              <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-mono">
                <Clock size={10} className="shrink-0" />
                <span>{dateString} • {timeString}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
