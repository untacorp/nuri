import { useState, useEffect } from 'react';
import { LibraryNode } from '~/types/library';

export function useCreateModal(
  isOpen: boolean,
  type: string,
  parentNode: LibraryNode | null,
  editNode: LibraryNode | null | undefined,
  onSubmit: (name: string, type: string, parentNode: LibraryNode | null, customPath?: string, description?: string, coverImage?: string, autoCompile?: boolean | null) => void,
  onClose: () => void
) {
  const [name, setName] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [createSubfolder, setCreateSubfolder] = useState(true);
  const [autoCompile, setAutoCompile] = useState<'inherit' | 'active' | 'inactive'>('inherit');
  
  useEffect(() => { 
    if (isOpen) {
      if (type === 'edit-book' && editNode) {
        setName(editNode.name);
        setCustomPath(editNode.path);
        setDescription(editNode.description || '');
        setCoverImage(editNode.cover_image || '');
        setCreateSubfolder(false);
        if (editNode.auto_compile === true) {
          setAutoCompile('active');
        } else if (editNode.auto_compile === false) {
          setAutoCompile('inactive');
        } else {
          setAutoCompile('inherit');
        }
      } else {
        setName('');
        setCustomPath('');
        setDescription('');
        setCoverImage('');
        setCreateSubfolder(true);
        setAutoCompile('inherit');
      }
    }
  }, [isOpen, type, editNode]);

  const getFinalPath = () => {
    let path = customPath.trim();
    if (!path) return '';
    if (createSubfolder && name.trim()) {
      const separator = path.includes('\\') ? '\\' : '/';
      if (path.endsWith('/') || path.endsWith('\\')) {
        path = path.slice(0, -1);
      }
      return `${path}${separator}${name.trim()}`;
    }
    return path;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 240;
          const maxH = 320;
          
          canvas.width = maxW;
          canvas.height = maxH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imgRatio = img.width / img.height;
            const targetRatio = maxW / maxH;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;
            
            if (imgRatio > targetRatio) {
              sw = img.height * targetRatio;
              sx = (img.width - sw) / 2;
            } else {
              sh = img.width / targetRatio;
              sy = (img.height - sh) / 2;
            }
            
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxW, maxH);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setCoverImage(compressedBase64);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && ((type !== 'book' && type !== 'edit-book') || customPath.trim())) {
      onSubmit(
        name.trim(), 
        type, 
        parentNode, 
        (type === 'book' || type === 'edit-book') ? getFinalPath() : undefined,
        (type === 'book' || type === 'edit-book') ? description.trim() : undefined,
        (type === 'book' || type === 'edit-book') ? coverImage : undefined,
        (type === 'book' || type === 'edit-book') ? (autoCompile === 'active' ? true : autoCompile === 'inactive' ? false : null) : undefined
      );
      onClose();
    }
  };

  return {
    name,
    setName,
    customPath,
    setCustomPath,
    description,
    setDescription,
    coverImage,
    setCoverImage,
    createSubfolder,
    setCreateSubfolder,
    autoCompile,
    setAutoCompile,
    getFinalPath,
    handleImageChange,
    handleSubmit
  };
}
