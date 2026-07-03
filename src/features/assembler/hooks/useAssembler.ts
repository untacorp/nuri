import { useState, useEffect } from 'react';
import { fetchChapterConfig, saveChapterConfig } from '../../editor/services/api';
import { updateBook } from '../../library/services/api';
import { LibraryNode } from '~/types/library';

export function useAssembler(
  activeBook: LibraryNode | null,
  activePath: string | null,
  reloadTree: () => void,
  onAutoCompile?: (path: string) => void
) {
  const [config, setConfig] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const disabledChapters = activeBook?.disabled_chapters || [];
  const isAutoCompileActive = activePath ? !disabledChapters.includes(activePath) : false;

  const handleToggleAutoCompile = async () => {
    if (!activeBook || !activePath) return;
    const currentDisabled = activeBook.disabled_chapters || [];
    const isCurrentlyDisabled = currentDisabled.includes(activePath);
    
    let newDisabled: string[];
    if (isCurrentlyDisabled) {
      newDisabled = currentDisabled.filter(p => p !== activePath);
    } else {
      newDisabled = [...currentDisabled, activePath];
    }
    
    try {
      await updateBook(
        activeBook.path,
        activeBook.name,
        activeBook.description,
        activeBook.cover_image,
        activeBook.auto_compile,
        newDisabled
      );
      reloadTree();
    } catch (err) {
      console.error("Failed to update auto-compile setting:", err);
    }
  };

  useEffect(() => {
    if (activePath) {
      setLoading(true);
      fetchChapterConfig(activePath).then(data => {
        setConfig(data.config || []);
        setAvailableFiles(data.availableFiles || []);
        setLoading(false);
      });
    }
  }, [activePath]);

  const handleSave = (newConfig: string[]) => {
    setConfig(newConfig);
    if (activePath) {
      saveChapterConfig(activePath, newConfig).then(() => {
        if (onAutoCompile) onAutoCompile(activePath);
      });
    }
  };

  const changeVariation = (index: number, newFile: string) => {
    const newConfig = [...config];
    newConfig[index] = newFile;
    handleSave(newConfig);
  };

  const handleRemoveBlock = (index: number) => {
    const newConfig = [...config];
    newConfig.splice(index, 1);
    handleSave(newConfig);
  };

  const handleAddBlock = (file: string) => {
    handleSave([...config, file]);
  };

  return {
    config,
    setConfig,
    availableFiles,
    loading,
    isAutoCompileActive,
    handleToggleAutoCompile,
    handleSave,
    changeVariation,
    handleRemoveBlock,
    handleAddBlock
  };
}
