import { useState, useEffect } from 'react';
import { fetchChapterConfig, saveChapterConfig } from '../../editor/services/api';
import { showAlert } from '../../ui/components/GlobalDialog';
import { compileManuscript, updateBook } from '../../library/services/api';
import { GripVertical, Settings2, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { LibraryNode } from '../../library/components/TreeNode';

interface AssemblerViewProps {
  activeBook: LibraryNode | null;
  activePath: string | null;
  chapterName: string;
  reloadTree: () => void;
  onAutoCompile?: (path: string) => void;
}

export default function AssemblerView({ activeBook, activePath, chapterName, reloadTree, onAutoCompile }: AssemblerViewProps) {
  const [config, setConfig] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // DnD State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

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

  // Pointer-based DnD & Reorder Handlers
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newConfig = [...config];
    const item = newConfig.splice(index, 1)[0];
    newConfig.splice(index - 1, 0, item);
    handleSave(newConfig);
  };

  const moveDown = (index: number) => {
    if (index === config.length - 1) return;
    const newConfig = [...config];
    const item = newConfig.splice(index, 1)[0];
    newConfig.splice(index + 1, 0, item);
    handleSave(newConfig);
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (e.button !== 0) return; // Only drag with left click
    
    // Prevent default text selection or dragging behavior
    e.preventDefault();
    
    const gripElement = e.currentTarget;
    const itemElement = gripElement.closest('[data-drag-index]');
    if (!itemElement) return;
    
    const listContainer = itemElement.parentElement;
    if (!listContainer) return;
    
    setDraggedIdx(index);
    
    // Collect coordinates of all items
    const childElements = Array.from(listContainer.querySelectorAll('[data-drag-index]')) as HTMLElement[];
    const rects = childElements.map(el => el.getBoundingClientRect());
    
    let currentIdx = index;
    let currentConfig = [...config];
    
    const onPointerMove = (moveEvent: PointerEvent) => {
      const clientY = moveEvent.clientY;
      let targetIdx = currentIdx;
      
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        const middleY = rect.top + rect.height / 2;
        
        if (i === 0 && clientY < middleY) {
          targetIdx = 0;
          break;
        } else if (i === rects.length - 1 && clientY > middleY) {
          targetIdx = rects.length - 1;
          break;
        } else if (clientY >= rect.top && clientY <= rect.bottom) {
          targetIdx = i;
          break;
        }
      }
      
      if (targetIdx !== currentIdx) {
        const nextConfig = [...currentConfig];
        const item = nextConfig.splice(currentIdx, 1)[0];
        nextConfig.splice(targetIdx, 0, item);
        
        // Update local state for immediate visual feedback
        setConfig(nextConfig);
        
        // Keep track of the current active position and configuration
        currentConfig = nextConfig;
        currentIdx = targetIdx;
        setDraggedIdx(targetIdx);
      }
    };
    
    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      
      setDraggedIdx(null);
      handleSave(currentConfig);
    };
    
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  // Find files not in config
  const unassignedFiles = availableFiles.filter(f => !config.includes(f));

  if (loading) return <div className="flex-1 flex justify-center items-center font-mono text-xs tracking-wider text-text-muted">Loading...</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-bg-main px-8 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-border-main">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold font-mono tracking-wider text-text-main">
              {chapterName}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={isAutoCompileActive}
                onChange={handleToggleAutoCompile}
                className="w-4 h-4 accent-accent bg-bg-input border-border-main rounded-none cursor-pointer focus:ring-0 focus:outline-hidden"
              />
              <span className="text-xs font-bold font-mono tracking-wider text-text-main">
                Auto-Compile
              </span>
            </label>

            <button
              onClick={() => {
                if (activePath) {
                  compileManuscript(activePath).then((res) => {
                    if (res.success) {
                      showAlert("Kompilasi Sukses", `Kompilasi "${chapterName}" berhasil!\nDisimpan di:\n${res.compiledPath}`);
                    } else {
                      showAlert("Kompilasi Gagal", `Gagal melakukan kompilasi: ${res.error}`);
                    }
                  });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card hover:bg-accent hover:text-accent-foreground text-text-main border border-border-main rounded-none text-xs font-bold font-mono transition-colors cursor-pointer"
              title="Kompilasi semua bagian ini menjadi satu file MD"
            >
              Kompilasi
            </button>
          </div>
        </div>

        <div className="bg-bg-card rounded-none border border-border-main overflow-hidden mb-8">
          <div className="bg-bg-input px-6 py-4 border-b border-border-main flex items-center justify-between">
            <h2 className="font-bold text-text-main text-xs tracking-wider font-mono">Urutan Dokumen</h2>
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-text-muted">
              <Settings2 size={14} /> Total {config.length} Item
            </div>
          </div>
          
          <div className="p-4 flex flex-col gap-3 min-h-[150px]">
            {config.length === 0 && (
              <div className="text-center py-10 text-xs font-mono text-text-muted border border-dashed border-border-main rounded-none bg-bg-input">
                Belum ada dokumen yang dimasukkan ke sini.
              </div>
            )}
            
            {config.map((filename, idx) => {
              // Extract part metadata and variations (supports nested folders and underscored suffix files)
              let partLabel = filename;
              let prefix = filename;
              
              if (filename.includes('/')) {
                const parts = filename.split('/');
                partLabel = parts[0];
                prefix = parts[0] + '/';
              } else {
                const lastUnderscore = filename.lastIndexOf('_');
                if (lastUnderscore !== -1) {
                  partLabel = filename.substring(0, lastUnderscore);
                  prefix = partLabel + '_';
                } else {
                  partLabel = filename.replace(/\.md$/, '');
                  prefix = partLabel;
                }
              }
              
              const variations = availableFiles.filter(f => f.startsWith(prefix));

              return (
                <div 
                  key={`${filename}-${idx}`}
                  data-drag-index={idx}
                  className={`flex items-center gap-4 bg-bg-card border ${draggedIdx === idx ? 'border-text-main opacity-50 bg-bg-input' : 'border-border-main hover:border-text-main'} p-3 rounded-none transition-colors group`}
                >
                  <div className="flex items-center gap-1 shrink-0">
                    <div 
                      className="text-text-muted hover:text-text-main cursor-grab active:cursor-grabbing p-1 touch-none"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(e) => startDrag(e, idx)}
                      title="Tarik untuk memindahkan"
                    >
                      <GripVertical size={18} />
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="text-text-muted hover:text-text-main disabled:opacity-20 disabled:hover:text-text-muted cursor-pointer transition-colors p-0.5"
                        title="Pindahkan ke atas"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === config.length - 1}
                        className="text-text-muted hover:text-text-main disabled:opacity-20 disabled:hover:text-text-muted cursor-pointer transition-colors p-0.5"
                        title="Pindahkan ke bawah"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="w-7 h-7 rounded-none bg-bg-input border border-border-main flex items-center justify-center text-xs font-mono font-bold text-text-main shrink-0">
                    {idx + 1}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[9px] text-text-muted font-bold tracking-widest font-mono mb-0.5">{partLabel}</span>
                    {variations.length > 1 ? (
                      <div className="relative inline-block w-full">
                        <select 
                          value={filename}
                          onChange={(e) => changeVariation(idx, e.target.value)}
                          className="bg-bg-input font-bold font-mono text-xs text-text-main border border-border-main hover:border-text-main focus:outline-none px-2 py-1 appearance-none cursor-pointer pr-6 rounded-none w-full"
                        >
                          {variations.map(v => {
                            const vLabel = v.includes('/') ? v.split('/').pop() : (v.lastIndexOf('_') !== -1 ? v.substring(v.lastIndexOf('_') + 1) : v);
                            return (
                              <option key={v} value={v} className="bg-bg-card text-text-main">{vLabel}</option>
                            );
                          })}
                        </select>
                        <span className="absolute inset-y-0 right-2 flex items-center pr-2 pointer-events-none text-text-muted text-[10px]">▼</span>
                      </div>
                    ) : (
                      <span className="font-bold font-mono text-xs text-text-main">
                        {filename.includes('/') ? filename.split('/').pop() : filename.replace(/\.md$/, '')}
                      </span>
                    )}
                    {variations.length > 1 && (
                      <span className="text-[9px] font-mono text-text-muted mt-0.5">Memiliki {variations.length} opsi variasi</span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveBlock(idx)}
                    className="p-1.5 text-text-muted hover:text-red-500 hover:bg-bg-input border border-transparent hover:border-border-main rounded-none opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {unassignedFiles.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold font-mono tracking-widest text-text-muted mb-3 ml-1">Part yang belum dirakit</h3>
            <div className="flex flex-wrap gap-2">
              {unassignedFiles.map(file => (
                <button 
                  key={file}
                  onClick={() => handleAddBlock(file)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border-main hover:border-text-main rounded-none text-xs font-bold font-mono text-text-muted hover:text-text-main transition-colors"
                >
                  <Plus size={14} />
                  {file}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

