import React from 'react';

interface Entry { path: string; name: string; isDir: boolean }

const WorkspaceTree: React.FC = () => {
  const [filter, setFilter] = React.useState('');
  const [entries, setEntries] = React.useState<Entry[]>([]);
  React.useEffect(() => {
    try { setEntries((window as any).rainvibe?.listDir?.() ?? []); } catch { setEntries([]); }
  }, []);
  const filtered = entries.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="h-full flex flex-col">
      <input placeholder="Search workspace" value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-2 px-2 py-1 bg-black text-white border border-white/15 rounded text-xs" />
      <div className="text-xs space-y-1 overflow-auto">
        {filtered.map(e => (
          <div key={e.path} className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded">
            <span className="opacity-60">{e.isDir ? '📁' : '📄'}</span>
            <span>{e.name}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className="opacity-60">No entries</div>}
      </div>
    </div>
  );
};

export default WorkspaceTree;

