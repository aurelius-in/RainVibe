import React from 'react';

export interface Buffer {
  id: string;
  path: string;
  language: string;
  content: string;
}

export function useBuffers() {
  const [buffers, setBuffers] = React.useState<Buffer[]>(() => {
    try {
      const raw = localStorage.getItem('rainvibe.buffers');
      return raw ? JSON.parse(raw) as Buffer[] : [{ id: 'welcome', path: 'WELCOME.ts', language: 'typescript', content: '// RainVibe — dark-only, Monaco-based IDE\n' }];
    } catch {
      return [{ id: 'welcome', path: 'WELCOME.ts', language: 'typescript', content: '// RainVibe — dark-only, Monaco-based IDE\n' }];
    }
  });
  const [activeId, setActiveId] = React.useState<string>(() => {
    try { return localStorage.getItem('rainvibe.buffers.active') || 'welcome'; } catch { return 'welcome'; }
  });

  React.useEffect(() => {
    try { localStorage.setItem('rainvibe.buffers', JSON.stringify(buffers)); } catch {}
  }, [buffers]);
  React.useEffect(() => {
    try { localStorage.setItem('rainvibe.buffers.active', activeId); } catch {}
  }, [activeId]);

  const update = (id: string, content: string) => {
    setBuffers((prev) => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const open = (relPath: string) => {
    try {
      const text = (window as any).rainvibe?.readTextFile?.(relPath);
      if (text == null) return;
      const id = relPath;
      setBuffers(prev => {
        const exists = prev.find(b => b.id === id);
        if (exists) return prev;
        return [...prev, { id, path: relPath, language: guessLang(relPath), content: String(text) }];
      });
      setActiveId(id);
      pushRecent(relPath);
    } catch {}
  };

  const save = (id: string) => {
    const buf = buffers.find(b => b.id === id);
    if (!buf) return false;
    try {
      const ok = !!(window as any).rainvibe?.writeTextFile?.(buf.path, buf.content);
      if (ok) pushRecent(buf.path);
      return ok;
    } catch { return false; }
  };

  const close = (id: string) => {
    setBuffers(prev => prev.filter(b => b.id !== id));
    if (activeId === id && buffers.length > 1) {
      const next = buffers.find(b => b.id !== id);
      if (next) setActiveId(next.id);
    }
  };

  const newBuffer = (name: string = `untitled-${Date.now()}.txt`) => {
    const id = name;
    setBuffers(prev => [...prev, { id, path: name, language: guessLang(name), content: '' }]);
    setActiveId(id);
  };

  const closeOthers = (id: string) => {
    setBuffers(prev => prev.filter(b => b.id === id));
    setActiveId(id);
  };

  const closeAll = () => {
    setBuffers(prev => prev.filter(b => b.id === 'welcome'));
    setActiveId('welcome');
  };

  return { buffers, activeId, setActiveId, update, open, save, close, newBuffer, closeOthers, closeAll };
}

function guessLang(p: string): string {
  if (p.endsWith('.ts') || p.endsWith('.tsx')) return 'typescript';
  if (p.endsWith('.js') || p.endsWith('.jsx')) return 'javascript';
  if (p.endsWith('.json')) return 'json';
  if (p.endsWith('.md')) return 'markdown';
  if (p.endsWith('.css')) return 'css';
  return 'plaintext';
}

function pushRecent(p: string) {
  try {
    const key = 'rainvibe.recent';
    const arr = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    const next = [p, ...arr.filter(x => x !== p)].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

