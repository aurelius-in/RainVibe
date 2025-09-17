import React from 'react';

export interface Buffer {
  id: string;
  path: string;
  language: string;
  content: string;
}

export function useBuffers() {
  const [buffers, setBuffers] = React.useState<Buffer[]>([{
    id: 'welcome', path: 'WELCOME.ts', language: 'typescript', content: '// RainVibe — dark-only, Monaco-based IDE\n',
  }]);
  const [activeId, setActiveId] = React.useState<string>('welcome');

  const update = (id: string, content: string) => {
    setBuffers((prev) => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  return { buffers, activeId, setActiveId, update };
}

