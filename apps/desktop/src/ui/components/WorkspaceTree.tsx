import React from 'react';
import { useBuffers } from '../state/useBuffers';

interface Entry { path: string; name: string; isDir: boolean }

const WorkspaceTree: React.FC = () => {
  const [filter, setFilter] = React.useState<string>(() => {
    try { return localStorage.getItem('rainvibe.workspace.filter') || ''; } catch { return ''; }
  });
  const [entries, setEntries] = React.useState<Entry[]>([]);
  React.useEffect(() => {
    try { setEntries((window as any).rainvibe?.listDir?.() ?? []); } catch { setEntries([]); }
  }, []);
  const filtered = entries.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()));
  const { open } = useBuffers();
  return (
    <div className="h-full flex flex-col">
      <input placeholder="Search workspace" value={filter} onChange={(e) => { setFilter(e.target.value); try { localStorage.setItem('rainvibe.workspace.filter', e.target.value); } catch {} }} className="mb-2 px-2 py-1 bg-black text-white border border-white/15 rounded text-xs" />
      <div className="text-xs space-y-1 overflow-auto">
        {filtered.map(e => (
          <div key={e.path} onClick={() => !e.isDir && open(e.path)} className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded cursor-pointer">
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

