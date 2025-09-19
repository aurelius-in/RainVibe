import React from 'react';

export interface Buffer {
  id: string;
  path: string;
  language: string;
  content: string;
  savedContent?: string;
}

type BufferAction =
  | { kind: 'new'; id: string }
  | { kind: 'close'; buffer: Buffer; wasActive: boolean }
  | { kind: 'rename'; fromId: string; toId: string; fromPath: string; toPath: string; fromLanguage: string; toLanguage: string };

export function useBuffers() {
  const [buffers, setBuffers] = React.useState<Buffer[]>(() => {
    try {
      const raw = localStorage.getItem('rainvibe.buffers');
      const parsed = raw ? JSON.parse(raw) as Buffer[] : [{ id: 'welcome', path: 'WELCOME.ts', language: 'typescript', content: '// RainVibe — dark-only, Monaco-based IDE\n' } as Buffer];
      return parsed.map(b => ({ ...b, savedContent: b.savedContent ?? b.content }));
    } catch {
      return [{ id: 'welcome', path: 'WELCOME.ts', language: 'typescript', content: '// RainVibe — dark-only, Monaco-based IDE\n' } as Buffer];
    }
  });
  const [activeId, setActiveId] = React.useState<string>(() => {
    try { return localStorage.getItem('rainvibe.buffers.active') || 'welcome'; } catch { return 'welcome'; }
  });
  const [closedStack, setClosedStack] = React.useState<Buffer[]>([]);
  const [history, setHistory] = React.useState<BufferAction[]>([]);
  const [redoStack, setRedoStack] = React.useState<BufferAction[]>([]);

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
        return [...prev, { id, path: relPath, language: guessLang(relPath), content: String(text), savedContent: String(text) }];
      });
      setActiveId(id);
      pushRecent(relPath);
      setHistory(prev => [...prev, { kind: 'new', id }]);
      setRedoStack([]);
    } catch {}
  };

  const save = (id: string) => {
    const buf = buffers.find(b => b.id === id);
    if (!buf) return false;
    try {
      const ok = !!(window as any).rainvibe?.writeTextFile?.(buf.path, buf.content);
      if (ok) {
        pushRecent(buf.path);
        setBuffers(prev => prev.map(b => b.id === id ? { ...b, savedContent: b.content } : b));
      }
      return ok;
    } catch { return false; }
  };

  const close = (id: string) => {
    const buf = buffers.find(b => b.id === id);
    const dirty = buf ? buf.content !== (buf.savedContent ?? '') : false;
    if (dirty) {
      const ok = window.confirm('You have unsaved changes. Close anyway?');
      if (!ok) return;
    }
    if (buf) setClosedStack(prev => [buf, ...prev].slice(0, 20));
    setBuffers(prev => prev.filter(b => b.id !== id));
    if (activeId === id && buffers.length > 1) {
      const next = buffers.find(b => b.id !== id);
      if (next) setActiveId(next.id);
    }
    if (buf) {
      setHistory(prev => [...prev, { kind: 'close', buffer: buf, wasActive: activeId === id }]);
      setRedoStack([]);
    }
  };

  const newBuffer = (name: string = `untitled-${Date.now()}.txt`) => {
    const id = name;
    setBuffers(prev => [...prev, { id, path: name, language: guessLang(name), content: '', savedContent: '' }]);
    setActiveId(id);
    setHistory(prev => [...prev, { kind: 'new', id }]);
    setRedoStack([]);
  };

  const renameBuffer = (oldId: string, newPath: string) => {
    setBuffers(prev => prev.map(b => {
      if (b.id !== oldId) return b;
      const nextLang = guessLang(newPath);
      return { ...b, id: newPath, path: newPath, language: nextLang };
    }));
    if (activeId === oldId) setActiveId(newPath);
    const buf = buffers.find(b => b.id === oldId);
    if (buf) {
      setHistory(prev => [...prev, { kind: 'rename', fromId: oldId, toId: newPath, fromPath: buf.path, toPath: newPath, fromLanguage: buf.language, toLanguage: guessLang(newPath) }]);
      setRedoStack([]);
    }
  };

  const setLanguageFor = (id: string, language: string) => {
    setBuffers(prev => prev.map(b => b.id === id ? { ...b, language } : b));
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory(prev => prev.slice(0, prev.length - 1));
    if (last.kind === 'new') {
      // Undo new: close it
      setBuffers(prev => prev.filter(b => b.id !== last.id));
      setRedoStack(prev => [{ kind: 'new', id: last.id }, ...prev]);
      if (activeId === last.id) {
        const next = buffers.find(b => b.id !== last.id);
        if (next) setActiveId(next.id);
      }
    } else if (last.kind === 'close') {
      // Undo close: reopen buffer
      setBuffers(prev => [...prev, last.buffer]);
      if (last.wasActive) setActiveId(last.buffer.id);
      setRedoStack(prev => [{ kind: 'close', buffer: last.buffer, wasActive: last.wasActive }, ...prev]);
    } else if (last.kind === 'rename') {
      // Undo rename: revert to from
      setBuffers(prev => prev.map(b => b.id === last.toId ? { ...b, id: last.fromId, path: last.fromPath, language: last.fromLanguage } : b));
      if (activeId === last.toId) setActiveId(last.fromId);
      setRedoStack(prev => [{ kind: 'rename', fromId: last.toId, toId: last.fromId, fromPath: last.toPath, toPath: last.fromPath, fromLanguage: last.toLanguage, toLanguage: last.fromLanguage }, ...prev]);
    }
  };

  const redo = () => {
    const next = redoStack[0];
    if (!next) return;
    setRedoStack(prev => prev.slice(1));
    if (next.kind === 'new') {
      setBuffers(prev => prev.find(b => b.id === next.id) ? prev : [...prev, { id: next.id, path: next.id, language: guessLang(next.id), content: '', savedContent: '' }]);
      setActiveId(next.id);
      setHistory(prev => [...prev, next]);
    } else if (next.kind === 'close') {
      setBuffers(prev => prev.filter(b => b.id !== next.buffer.id));
      setHistory(prev => [...prev, next]);
    } else if (next.kind === 'rename') {
      setBuffers(prev => prev.map(b => b.id === next.fromId ? { ...b, id: next.toId, path: next.toPath, language: next.toLanguage } : b));
      if (activeId === next.fromId) setActiveId(next.toId);
      setHistory(prev => [...prev, next]);
    }
  };

  const closeOthers = (id: string) => {
    setBuffers(prev => prev.filter(b => b.id === id));
    setActiveId(id);
  };

  const closeAll = () => {
    setBuffers(prev => prev.filter(b => b.id === 'welcome'));
    setActiveId('welcome');
  };

  const closeLeftOf = (id: string) => {
    const idx = buffers.findIndex(b => b.id === id);
    if (idx <= 0) return;
    const left = buffers.slice(0, idx).filter(b => b.id !== 'welcome');
    setClosedStack(prev => [...left.reverse(), ...prev].slice(0, 20));
    setBuffers(prev => prev.filter((_, i) => i >= idx || prev[i].id === 'welcome'));
  };

  const closeRightOf = (id: string) => {
    const idx = buffers.findIndex(b => b.id === id);
    if (idx < 0) return;
    const right = buffers.slice(idx + 1).filter(b => b.id !== 'welcome');
    setClosedStack(prev => [...right.reverse(), ...prev].slice(0, 20));
    setBuffers(prev => prev.filter((_, i) => i <= idx || prev[i].id === 'welcome'));
  };

  const reopenClosed = () => {
    const [top, ...rest] = closedStack;
    if (!top) return;
    setClosedStack(rest);
    setBuffers(prev => [...prev, top]);
    setActiveId(top.id);
  };

  const isDirty = (b: Buffer) => b.content !== (b.savedContent ?? '');

  return { buffers, activeId, setActiveId, update, open, save, close, newBuffer, closeOthers, closeAll, isDirty, renameBuffer, closeLeftOf, closeRightOf, reopenClosed, setLanguageFor, undo, redo };
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

