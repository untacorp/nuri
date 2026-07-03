import { parseMarkdown } from '~/features/editor/utils/markdown';
import { saveFile, createVariation } from '~/features/editor/services/api';
import { showPrompt, showConfirm, showAlert } from '~/features/ui/components/GlobalDialog';

export function useDiffActions(
  diffContent: { html: string; hash: string; rawContent: string } | null,
  setDiffContent: React.Dispatch<React.SetStateAction<any>>,
  activePath: string,
  editor: any,
  setStatus: React.Dispatch<React.SetStateAction<string>>,
  reloadTree: () => void
) {

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

  return { handleCreateVariationFromDiff, handleRestoreFromHistory };
}
