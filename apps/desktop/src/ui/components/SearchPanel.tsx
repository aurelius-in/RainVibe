import React from 'react';
import { useBuffers } from '../state/useBuffers';

const SearchPanel: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<{ path: string }[]>([]);
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
      const entries = ((window as any).rainvibe?.listDir?.() ?? []) as Array<{ path: string; name: string; isDir: boolean }>;
      const hits = entries.filter(e => e.name.toLowerCase().includes(q.toLowerCase())).map(e => ({ path: e.path }));
      setResults(hits);
    } catch { setResults([]); }
  };
  return (
    <div className="h-full flex flex-col text-xs">
      <div className="flex gap-2 mb-2">
        <input id="search-input" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 px-2 py-1 bg-black text-white border border-white/15 rounded" placeholder="Search files" />
        <button onClick={onSearch} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10">Search</button>
      </div>
      <div className="space-y-1 overflow-auto">
        {results.map(r => <button key={r.path} onClick={() => open(r.path)} className="w-full text-left px-2 py-1 border border-white/10 rounded hover:bg-white/10">{r.path}</button>)}
        {results.length === 0 && <div className="opacity-60">No results</div>}
      </div>
    </div>
  );
};

export default SearchPanel;

