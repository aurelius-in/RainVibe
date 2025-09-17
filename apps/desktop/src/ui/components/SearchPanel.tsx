import React from 'react';

const SearchPanel: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<{ path: string }[]>([]);
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
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 px-2 py-1 bg-black text-white border border-white/15 rounded" placeholder="Search files" />
        <button onClick={onSearch} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10">Search</button>
      </div>
      <div className="space-y-1 overflow-auto">
        {results.map(r => <div key={r.path} className="px-2 py-1 border border-white/10 rounded">{r.path}</div>)}
        {results.length === 0 && <div className="opacity-60">No results</div>}
      </div>
    </div>
  );
};

export default SearchPanel;

