import { Library, Plus, Trash2, Edit2 } from 'lucide-react';
import { LibraryNode } from './TreeNode';

interface HomeViewProps {
  tree: LibraryNode[];
  openBook: (book: LibraryNode) => void;
  onOpenModal: (type: string, parentNode: LibraryNode | null) => void;
  onEditBook: (book: LibraryNode) => void;
  onDeleteBook: (book: LibraryNode) => void;
}

export default function HomeView({ tree, openBook, onOpenModal, onEditBook, onDeleteBook }: HomeViewProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-12 pb-6 border-b border-border-main">
        <div className="flex items-center gap-3">
          <Library className="text-text-main" size={24} />
          <h1 className="text-xl font-bold tracking-wider font-mono">Koleksi Buku Saya</h1>
        </div>
        <button 
          onClick={() => onOpenModal('book', null)} 
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider bg-accent text-accent-foreground border border-accent hover:bg-accent-hover hover:border-accent-hover rounded-none transition-colors font-mono"
        >
          <Plus size={14} />
          Buku Baru
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {tree.map((book) => (
          <div 
            key={book.path} 
            onClick={() => openBook(book)}
            className="group relative aspect-3/4 bg-bg-card rounded-none border border-border-main hover:border-text-main transition-colors duration-200 p-5 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            {/* Spine Line */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-border-main group-hover:bg-text-main transition-colors"></div>

            {/* Action Buttons (Top Right) */}
            <div className="absolute top-3 right-3 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onEditBook(book); }}
                className="p-1 bg-bg-card hover:bg-text-main text-text-muted hover:text-accent-foreground border border-border-main hover:border-text-main rounded-none transition-colors"
                title="Ganti Judul"
              >
                <Edit2 size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteBook(book); }}
                className="p-1 bg-bg-card hover:bg-red-600 text-text-muted hover:text-white border border-border-main hover:border-red-600 rounded-none transition-colors"
                title="Hapus dari Koleksi"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Top Content (Book Info) */}
            <div className="pl-2 pt-4">
              <p className="text-[10px] text-text-muted font-mono tracking-wider">
                Book Volume
              </p>
            </div>

            {/* Bottom Content */}
            <div className="pl-2 pb-2">
              <h3 className="font-serif font-bold text-lg text-text-main leading-tight mb-2 group-hover:underline">
                {book.name}
              </h3>
              <p className="text-[10px] text-text-muted font-mono tracking-wider">
                {book.children ? book.children.length : 0} Bab
              </p>
            </div>
          </div>
        ))}
        
        <div 
          onClick={() => onOpenModal('book', null)} 
          className="aspect-3/4 border-2 border-dashed border-border-main hover:border-text-main bg-transparent hover:bg-bg-input rounded-none cursor-pointer flex flex-col items-center justify-center text-text-muted hover:text-text-main transition-all duration-200"
        >
          <div className="border border-border-main p-2 rounded-none mb-3">
            <Plus size={20} />
          </div>
          <span className="font-bold text-xs tracking-wider font-mono">Buku Baru</span>
        </div>
      </div>
    </div>
  );
}

