import React, { useState, useEffect, useCallback } from 'react';
import { History, GitCommit, X, Clock, RefreshCw } from 'lucide-react';
import { fetchHistory, fetchHistoryContent } from '../services/api';

export default function HistoryPanel({ activePath, onClose, onContentSelect, onVariationCreated }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHash, setSelectedHash] = useState(null);
  
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

  const handleViewCommit = (hash) => {
    setSelectedHash(hash);
    fetchHistoryContent(activePath, hash).then(data => {
      onContentSelect(data.content, hash);
    });
  };

  return (
    <div className="w-80 bg-bg-card border-l border-border-main flex flex-col z-20">
      <div className="flex items-center justify-between p-4 border-b border-border-main">
        <div className="flex items-center gap-2 text-text-main">
          <History size={16} />
          <h3 className="font-bold text-xs uppercase tracking-wider font-mono">Mesin Waktu (Git)</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={loadHistory} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-input rounded-none border border-transparent hover:border-border-main transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-bg-input rounded-none border border-transparent hover:border-border-main transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-4 border-b border-border-main bg-bg-input">
        <p className="text-[11px] font-mono text-text-muted leading-relaxed">
          Setiap kali kamu berhenti mengetik, aplikasi otomatis menyimpan rekam jejak. Kamu tidak akan pernah kehilangan tulisan.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {history.length === 0 && !loading && (
          <div className="text-center text-xs text-text-muted font-mono mt-4">Belum ada riwayat.</div>
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
              className={`p-3 rounded-none border cursor-pointer transition-colors ${
                isSelected 
                  ? 'border-text-main bg-bg-input font-bold' 
                  : 'border-border-main hover:border-text-main bg-bg-card'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <GitCommit size={14} className={isSelected ? 'text-text-main' : 'text-text-muted'} />
                <span className="text-[10px] font-mono text-text-muted">{commit.hash.substring(0, 7)}</span>
              </div>
              <p className={`text-xs font-mono mb-2 ${isSelected ? 'text-text-main font-bold' : 'text-text-muted'}`}>
                {commit.message}
              </p>
              <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-mono">
                <Clock size={10} />
                <span>{dateString} • {timeString}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

