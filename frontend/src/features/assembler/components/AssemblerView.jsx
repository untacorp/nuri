import React, { useState, useEffect } from 'react';
import { fetchChapterConfig, saveChapterConfig } from '../../editor/services/api';
import { showAlert } from '../../ui/components/GlobalDialog';
import { compileManuscript } from '../../library/services/api';
import { Layers, GripVertical, Settings2, Trash2, Plus } from 'lucide-react';

export default function AssemblerView({ activePath, chapterName }) {
  const [config, setConfig] = useState([]);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // DnD State
  const [draggedIdx, setDraggedIdx] = useState(null);

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

  const handleSave = (newConfig) => {
    setConfig(newConfig);
    saveChapterConfig(activePath, newConfig);
  };

  const changeVariation = (index, newFile) => {
    const newConfig = [...config];
    newConfig[index] = newFile;
    handleSave(newConfig);
  };

  const handleRemoveBlock = (index) => {
    const newConfig = [...config];
    newConfig.splice(index, 1);
    handleSave(newConfig);
  };

  const handleAddBlock = (file) => {
    handleSave([...config, file]);
  };

  // DnD Handlers
  const onDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index); // Firefox needs data
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const newConfig = [...config];
    const item = newConfig.splice(draggedIdx, 1)[0];
    newConfig.splice(index, 0, item);
    handleSave(newConfig);
    setDraggedIdx(null);
  };

  // Find files not in config
  const unassignedFiles = availableFiles.filter(f => !config.includes(f));

  if (loading) return <div className="flex-1 flex justify-center items-center font-mono text-xs uppercase tracking-wider text-text-muted">Loading...</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-bg-main px-8 py-16 animate-in fade-in duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-border-main">
          <div className="flex items-center gap-4">
            <div className="bg-bg-input p-3 rounded-none text-text-main border border-border-main">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-text-main mb-1">
                Assembler
              </h1>
              <p className="text-xs font-mono text-text-muted">
                Tarik, lepas, dan susun urutan Part untuk Bab <span className="font-bold text-text-main">"{chapterName}"</span>.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              compileManuscript(activePath).then((res) => {
                if (res.success) {
                  showAlert("Kompilasi Sukses", `Bab "${chapterName}" berhasil dikompilasi!\nDisimpan di:\n${res.compiledPath}`);
                } else {
                  showAlert("Kompilasi Gagal", `Gagal kompilasi Bab: ${res.error}`);
                }
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card hover:bg-accent hover:text-accent-foreground text-text-main border border-border-main rounded-none text-xs font-bold font-mono uppercase transition-colors cursor-pointer"
            title="Kompilasi Draf di Bab Ini menjadi Satu File MD"
          >
            Compile Bab
          </button>
        </div>

        <div className="bg-bg-card rounded-none border border-border-main overflow-hidden mb-8">
          <div className="bg-bg-input px-6 py-4 border-b border-border-main flex items-center justify-between">
            <h2 className="font-bold text-text-main text-xs tracking-wider uppercase font-mono">Urutan Naskah (Chapter.json)</h2>
            <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase text-text-muted">
              <Settings2 size={14} /> Total {config.length} Part
            </div>
          </div>
          
          <div className="p-4 flex flex-col gap-3 min-h-[150px]">
            {config.length === 0 && (
              <div className="text-center py-10 text-xs font-mono text-text-muted border border-dashed border-border-main rounded-none bg-bg-input">
                Belum ada draf yang dirakit ke bab ini.
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
                  draggable
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, idx)}
                  className={`flex items-center gap-4 bg-bg-card border ${draggedIdx === idx ? 'border-text-main opacity-50 bg-bg-input' : 'border-border-main hover:border-text-main'} p-3 rounded-none transition-colors cursor-grab active:cursor-grabbing group`}
                >
                  <div className="text-text-muted hover:text-text-main">
                    <GripVertical size={20} />
                  </div>
                  
                  <div className="w-7 h-7 rounded-none bg-bg-input border border-border-main flex items-center justify-center text-xs font-mono font-bold text-text-main">
                    {idx + 1}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest font-mono mb-0.5">{partLabel}</span>
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
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-text-muted mb-3 ml-1">Part yang belum dirakit</h3>
            <div className="flex flex-wrap gap-2">
              {unassignedFiles.map(file => (
                <button 
                  key={file}
                  onClick={() => handleAddBlock(file)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border-main hover:border-text-main rounded-none text-xs font-bold font-mono uppercase text-text-muted hover:text-text-main transition-colors"
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

