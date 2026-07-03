import { useState, useEffect } from 'react';
import { DialogDetail } from '../components/GlobalDialog';

export function useGlobalDialog() {
  const [dialog, setDialog] = useState<DialogDetail | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isBlockMath, setIsBlockMath] = useState(false);

  useEffect(() => {
    const handleDialog = (e: CustomEvent<DialogDetail>) => {
      setDialog(e.detail);
      setInputValue(e.detail.defaultValue || '');
      setIsBlockMath(false);
    };
    window.addEventListener('global-dialog', handleDialog);
    return () => window.removeEventListener('global-dialog', handleDialog);
  }, []);

  const handleClose = () => {
    if (dialog) {
      dialog.resolve(null);
      setDialog(null);
    }
  };

  const handleConfirm = () => {
    if (dialog) {
      if (dialog.type === 'prompt') {
        dialog.resolve(inputValue);
      } else if (dialog.type === 'mathPrompt') {
        dialog.resolve({ latex: inputValue, isBlock: isBlockMath });
      } else {
        dialog.resolve(true);
      }
      setDialog(null);
    }
  };

  return {
    dialog,
    inputValue,
    setInputValue,
    isBlockMath,
    setIsBlockMath,
    handleClose,
    handleConfirm
  };
}
