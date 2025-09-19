import React from 'react';
import { useBuffers } from '../state/useBuffers';

const SearchPanel: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [mode, setMode] = React.useState<'filename' | 'content' | 'index' | 'symbols'>('filename');
  const [results, setResults] = React.useState<{ path: string; line?: number; preview?: string }[]>([]);
  const { open } = useBuffers();
  React.useEffect(() => {
    const handler = (e: any) => {
      const left = localStorage.getItem('rainvibe.ui.leftRail');
      if (left === 'search') {
        try { const el = document.getElementById('search-input') as HTMLInputElement | null; el?.focus(); } catch {}
      }
    };
    window.addEventListener('focus', handler as any);
    return () => window.removeEventListener('focus', handler as any);
  }, []);
  const onSearch = () => {
    try {
      if (mode === 'filename') {
        const entries = ((window as any).rainvibe?.listDir?.() ?? []) as Array<{ path: string; name: string; isDir: boolean }>;
        const hits = entries.filter(e => e.name.toLowerCase().includes(q.toLowerCase())).map(e => ({ path: e.path }));
        setResults(hits);
      } else if (mode === 'content') {
        const hits = ((window as any).rainvibe?.searchText?.(q) ?? []) as Array<{ path: string; line: number; preview: string }>;
        setResults(hits);
      } else if (mode === 'index') {
        const hits = ((window as any).rainvibe?.searchIndex?.(q) ?? []) as Array<{ path: string; line: number; preview: string }>;
        setResults(hits);
      } else {
        const hits = ((window as any).rainvibe?.searchSymbols?.(q) ?? []).map((s: any) => ({ path: s.path, line: s.line, preview: `${s.kind} ${s.name}` }));
        setResults(hits);
      }
    } catch { setResults([]); }
  };
  React.useEffect(() => {
    const handler = (e: any) => {
      const val = String(e?.detail || '');
      setQ(val);
      setTimeout(() => onSearch(), 0);
    };
    window.addEventListener('rainvibe:search', handler as any);
    return () => window.removeEventListener('rainvibe:search', handler as any);
  }, []);
  return (
    <div className="h-full flex flex-col text-xs">
      <div className="flex gap-2 mb-2">
        <select aria-label="Search mode" value={mode} onChange={(e) => setMode(e.target.value as any)} className="px-2 py-1 bg-black text-white border border-white/15 rounded">
          <option value="filename">Filename</option>
          <option value="content">Content</option>
          <option value="index">Index</option>
          <option value="symbols">Symbols</option>
        </select>
        <input aria-label="Search input" id="search-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onSearch(); if (results[0]) { (window as any).dispatchEvent(new CustomEvent('open-path', { detail: results[0].path })); } } }} className="flex-1 px-2 py-1 bg-black text-white border border-white/15 rounded" placeholder="Search files or content" />
        <button onClick={onSearch} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10">Search</button>
        <button onClick={() => { try { const n = (window as any).rainvibe?.buildIndex?.(); alert(`Indexed ${n} files`); } catch {} }} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10">Build Index</button>
        <button onClick={() => { try { const n = (window as any).rainvibe?.indexSymbols?.(); alert(`Indexed ${n} symbols`); } catch {} }} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10">Build Symbols</button>
      </div>
      <div className="space-y-1 overflow-auto">
        {results.map(r => (
          <button key={r.path} onClick={() => { open(r.path); if (r.line) { window.dispatchEvent(new CustomEvent('rainvibe:goto', { detail: { line: r.line, col: 1 } } as any)); } }} className="w-full text-left px-2 py-1 border border-white/10 rounded hover:bg-white/10">
            <div>{r.path}{r.line ? `:${r.line}` : ''}</div>
            {r.preview && <div className="opacity-60 text-[10px] truncate">{r.preview}</div>}
          </button>
        ))}
        {results.length === 0 && <div className="opacity-60">No results</div>}
      </div>
    </div>
  );
};

export default SearchPanel;

