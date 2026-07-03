import { useState, useEffect, useCallback } from 'react';
import { fetchHistory, fetchHistoryContent } from '~/features/editor/services/api';

export interface Commit {
  hash: string;
  message: string;
  date: string;
}

export function useTimeMachine(
  activePath: string | null,
  status: string | undefined,
  onContentSelect: (content: string, hash: string) => void
) {
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

  return {
    history,
    loading,
    selectedHash,
    loadHistory,
    handleViewCommit
  };
}
