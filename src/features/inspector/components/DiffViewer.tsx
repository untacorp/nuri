import { Copy, RotateCcw, X } from 'lucide-react';
import { parseMarkdown } from '~/features/editor/utils/markdown';
import { saveFile, createVariation } from '~/features/editor/services/api';
import { showPrompt, showConfirm, showAlert } from '~/features/ui/components/GlobalDialog';

interface DiffViewerProps {
  diffContent: { html: string; hash: string; rawContent: string };
  setDiffContent: React.Dispatch<React.SetStateAction<any>>;
  activePath: string;
  isReadOnly: boolean;
  reloadTree: () => void;
  editor: any;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
}

export default function DiffViewer({
  diffContent,
  setDiffContent,
  activePath,
  isReadOnly,
  reloadTree,
  editor,
  setStatus
}: DiffViewerProps) {

  const handleCreateVariationFromDiff = async () => {
    if (!diffContent || !diffContent.hash || !activePath) return;
    const suffix = await showPrompt("Nama akhiran variasi (misal: v2, alt, revisi):", "v2");
    if (suffix) {
      createVariation(activePath, suffix, diffContent.hash).then(() => {
        showAlert("Berhasil", "Variasi baru berhasil dibuat dari versi riwayat ini! Silakan lihat di Sidebar.");
        reloadTree();
        setDiffContent(null);
      });
    }
  };

  const handleRestoreFromHistory = async () => {
    if (!diffContent || !diffContent.rawContent || !activePath) return;
    const isConfirmed = await showConfirm(
      "Pulihkan Versi Ini?", 
      `Apakah kamu yakin ingin mengembalikan isi draf aktif ke versi dari commit ${diffContent.hash.substring(0, 7)}?\n\n(Tindakan ini akan menimpa draf aktif saat ini)`
    );
    if (isConfirmed) {
      if (editor) {
        editor.commands.setContent(parseMarkdown(diffContent.rawContent));
      }
      
      const markdown = diffContent.rawContent;
      setStatus('Saving...');
      saveFile(activePath, markdown)
        .then(() => {
          setStatus('Synced');
          showAlert("Berhasil", "Draf berhasil dikembalikan ke versi riwayat pilihanmu.");
          setDiffContent(null);
        })
        .catch((err) => {
          console.error(err);
          setStatus('Error');
          showAlert("Gagal", "Gagal memulihkan versi.");
        });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-card border-l border-border-main relative">
      <div className="w-full border-b border-border-main bg-bg-input px-6 py-3 flex items-center justify-between select-none">
        <span className="text-xs font-mono text-text-muted flex items-center gap-1.5 font-bold tracking-wider">
          Perbedaan Versi
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateVariationFromDiff}
            className="p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors text-text-muted hover:text-text-main hover:bg-bg-input cursor-pointer"
            title="Buat Variasi Baru dari Versi Ini"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleRestoreFromHistory}
            disabled={isReadOnly}
            className="p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors text-text-muted hover:text-text-main hover:bg-bg-input cursor-pointer disabled:opacity-30 disabled:hover:border-transparent disabled:hover:bg-transparent"
            title="Kembalikan isi draf aktif ke versi dari commit ini"
          >
            <RotateCcw size={14} />
          </button>
          
          <div className="w-px h-4 bg-border-main mx-2"></div>
          
          <button 
            onClick={() => setDiffContent(null)}
            className="p-1.5 rounded-none border border-transparent transition-colors text-text-muted hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 cursor-pointer"
            title="Tutup Perbandingan"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full bg-bg-card overflow-y-auto px-8 sm:px-16 md:px-24 py-12 flex flex-col">
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
          <div className="mb-6 border-b border-border-main pb-2 flex items-center justify-between text-[10px] font-bold text-text-muted select-none font-mono">
            <span className="bg-bg-input px-2.5 py-1 rounded-none border border-border-main truncate tracking-wider font-mono">
              {diffContent.hash.substring(0, 7)} VS LIVE
            </span>
          </div>
          <div 
            className="font-serif text-lg text-text-main leading-relaxed flex-1 outline-none prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:font-sans prose-h2:font-sans"
            dangerouslySetInnerHTML={{ __html: diffContent.html }}
          />
        </div>
      </div>
    </div>
  );
}
