import { useState } from 'react';

export function useInspectorAccordion(initialSections: string[] = []) {
  const [openSections, setOpenSections] = useState<string[]>(initialSections);

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return { openSections, toggleSection };
}
