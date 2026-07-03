import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Mathematics } from '@tiptap/extension-mathematics';
import { showPrompt } from '~/features/ui/components/GlobalDialog';
import { turndownService } from '~/features/editor/utils/markdown';
import { saveFile } from '~/features/editor/services/api';
import { EmDash } from '~/features/editor/extensions/EmDash';

interface UseAppEditorProps {
  activePathRef: React.MutableRefObject<string | null>;
  isUpdatingFromWs: React.MutableRefObject<boolean>;
  lastSentMarkdown: React.MutableRefObject<string>;
  saveTimeout: React.MutableRefObject<any>;
  setStatus: (status: string) => void;
  autoCompileIfEnabled: (filePath: string) => void;
}

export function useAppEditor({
  activePathRef,
  isUpdatingFromWs,
  lastSentMarkdown,
  saveTimeout,
  setStatus,
  autoCompileIfEnabled
}: UseAppEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      EmDash,
      Mathematics.configure({
        inlineOptions: {
          onClick: (node, pos) => {
            const currentLatex = node.attrs.latex;
            showPrompt("Edit Rumus LaTeX (Inline)", currentLatex).then((newLatex) => {
              if (newLatex !== null) {
                if (newLatex.trim() === '') {
                  // @ts-ignore
                  editor?.commands.deleteInlineMath({ pos });
                } else {
                  // @ts-ignore
                  editor?.commands.updateInlineMath({ latex: newLatex.trim(), pos });
                }
              }
            });
          }
        },
        blockOptions: {
          onClick: (node, pos) => {
            const currentLatex = node.attrs.latex;
            showPrompt("Edit Rumus LaTeX (Block)", currentLatex).then((newLatex) => {
              if (newLatex !== null) {
                if (newLatex.trim() === '') {
                  // @ts-ignore
                  editor?.commands.deleteBlockMath({ pos });
                } else {
                  // @ts-ignore
                  editor?.commands.updateBlockMath({ latex: newLatex.trim(), pos });
                }
              }
            });
          }
        }
      })
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const currentPath = activePathRef.current;
      if (isUpdatingFromWs.current || !currentPath || !currentPath.endsWith('.md')) return;
      
      setStatus('Editing...');
      
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        setStatus('Saving...');
        const html = editor.getHTML();
        const markdown = turndownService.turndown(html);
        
        if (markdown === lastSentMarkdown.current) {
          setStatus('Synced');
          return;
        }
        
        lastSentMarkdown.current = markdown;
        saveFile(currentPath, markdown)
          .then(() => {
            setStatus('Synced');
            autoCompileIfEnabled(currentPath);
          })
          .catch((err) => {
            console.error(err);
            setStatus('Error');
          });
      }, 1500);
    }
  });

  return editor;
}
