import React, { useState } from 'react';
import { FileText, Folder, FolderOpen, Plus, ChevronRight, ChevronDown } from 'lucide-react';

export interface LibraryNode {
  name: string;
  type: string;
  path: string;
  children?: LibraryNode[];
  description?: string;
  cover_image?: string;
  auto_compile?: boolean;
  disabled_chapters?: string[];
}

interface TreeNodeProps {
  node: LibraryNode;
  activePath: string | null;
  onSelect: (path: string) => void;
  onOpenModal: (type: string, node: LibraryNode) => void;
  onContextMenu?: (e: React.MouseEvent, node: LibraryNode) => void;
}

export default function TreeNode({ node, activePath, onSelect, onOpenModal, onContextMenu }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isPart = node.type === 'part' || node.type === 'version';
  const isActive = activePath === node.path;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = () => {
    if (node.type === 'part-folder') {
      setIsOpen(!isOpen);
    } else {
      onSelect(node.path);
    }
  };
  
  return (
    <div className="ml-2 mt-1">
      <div 
        className={`flex items-center gap-2 px-2 py-1.5 rounded-none cursor-pointer border border-transparent transition-colors group ${
          isActive ? 'bg-bg-input border-border-main text-text-main font-bold font-mono text-xs' : 
          'text-text-muted hover:text-text-main hover:bg-bg-input font-mono text-xs'
        }`}
        onClick={handleSelect}
        onContextMenu={(e) => {
          if (onContextMenu) {
            onContextMenu(e, node);
          }
        }}
      >
        {!isPart && (
          <button 
            type="button"
            onClick={handleToggle}
            className="p-0.5 hover:bg-bg-input border border-transparent hover:border-border-main rounded-none transition-colors text-text-muted hover:text-text-main shrink-0"
          >
            {isOpen ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
          </button>
        )}
        {isPart ? <FileText size={14} className="shrink-0" /> : (isOpen ? <FolderOpen size={14} className="shrink-0" /> : <Folder size={14} className="shrink-0" />)}
        <span className="truncate select-none">{node.name.replace('.md', '')}</span>
        
        {!isPart && (
          <button 
            type="button"
            className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-bg-input border border-transparent hover:border-border-main rounded-none text-text-muted hover:text-text-main shrink-0"
            onClick={(e) => { 
              e.stopPropagation(); 
              const typeToCreate = node.type === 'book' ? 'chapter' : (node.type === 'chapter' ? 'part' : 'version');
              onOpenModal(typeToCreate, node); 
            }}
          >
            <Plus size={10} className="shrink-0" />
          </button>
        )}
      </div>
      
      {!isPart && isOpen && node.children && (
        <div className="ml-3 border-l border-border-main pl-1.5">
          {node.children.map((child: LibraryNode, idx: number) => (
            <TreeNode key={idx} node={child} activePath={activePath} onSelect={onSelect} onOpenModal={onOpenModal} onContextMenu={onContextMenu} />
          ))}
        </div>
      )}
    </div>
  );
}

