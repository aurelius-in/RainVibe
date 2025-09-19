import React from 'react';
import { useBuffers } from '../state/useBuffers';

interface Entry { path: string; name: string; isDir: boolean }

const WorkspaceTree: React.FC = () => {
  const [cwd, setCwd] = React.useState<string>('');
  const [filter, setFilter] = React.useState<string>(() => {
    try { return localStorage.getItem('rainvibe.workspace.filter') || ''; } catch { return ''; }
  });
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [menu, setMenu] = React.useState<{ x: number; y: number; entry?: Entry } | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [drag, setDrag] = React.useState<{ from?: string } | null>(null);
  React.useEffect(() => {
    try { setEntries((window as any).rainvibe?.listDir?.(cwd) ?? []); } catch { setEntries([]); }
  }, [cwd]);
  React.useEffect(() => {
    const handler = (e: any) => {
      const val = e?.detail ?? '';
      setFilter(String(val));
      try { localStorage.setItem('rainvibe.workspace.filter', String(val)); } catch {}
    };
    window.addEventListener('rainvibe:filter', handler as any);
    const refreshHandler = () => refresh();
    window.addEventListener('rainvibe:workspace:refresh', refreshHandler as any);
    const cwdHandler = (e: any) => { const path = String(e?.detail || ''); setCwd(path); };
    window.addEventListener('rainvibe:cwd', cwdHandler as any);
    return () => { window.removeEventListener('rainvibe:filter', handler as any); window.removeEventListener('rainvibe:workspace:refresh', refreshHandler as any); window.removeEventListener('rainvibe:cwd', cwdHandler as any); };
  }, []);
  const filtered = entries.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()) || e.path.toLowerCase().includes(filter.toLowerCase()));
  const { open } = useBuffers();
  const refresh = () => {
    try { setEntries((window as any).rainvibe?.listDir?.(cwd) ?? []); } catch { setEntries([]); }
  };
  React.useEffect(() => {
    const id = setInterval(() => refresh(), 5000);
    return () => clearInterval(id);
  }, [cwd]);
  const toggleSelect = (p: string, additive: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (!additive) next.clear();
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };
  return (
    <div className="h-full flex flex-col" onMouseDown={() => setMenu(null)}>
      <div className="flex items-center gap-2 mb-2">
        <button aria-label="Go to root" onClick={() => setCwd('')} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">Root</button>
        {cwd && <button aria-label="Go up one folder" onClick={() => { const parts = cwd.split('/'); parts.pop(); setCwd(parts.join('/')); }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">Up</button>}
        {cwd && <span className="text-xs opacity-70">{cwd}</span>}
      </div>
      <input aria-label="Search workspace" placeholder="Search workspace" value={filter} onChange={(e) => { setFilter(e.target.value); try { localStorage.setItem('rainvibe.workspace.filter', e.target.value); } catch {} }} className="mb-2 px-2 py-1 bg-black text-white border border-white/15 rounded text-xs" />
      <div className="text-xs space-y-1 overflow-auto" tabIndex={0} onKeyDown={(e) => {
        if (e.key === 'F2' && menu?.entry) {
          const to = prompt('Rename to (relative path):', menu.entry.path);
          if (to && to !== menu.entry.path) { try { (window as any).rainvibe?.renamePath?.(menu.entry.path, to); refresh(); } catch {} }
        }
        if (e.key === 'Enter' && menu?.entry) { if (menu.entry.isDir) { setCwd(menu.entry.path); } else { open(menu.entry.path); } }
        if (e.key === 'Delete' && menu?.entry) { const ok = confirm(`Delete ${menu.entry.path}?`); if (ok) { try { (window as any).rainvibe?.deletePath?.(menu.entry.path); refresh(); } catch {} } }
      }}>
        {filtered.map(e => (
          <div
            key={e.path}
            onDoubleClick={() => { if (e.isDir) setCwd(e.path); else open(e.path); }}
            onClick={(ev) => { setMenu({ x: 0, y: 0, entry: e }); toggleSelect(e.path, !!(ev.ctrlKey || ev.metaKey)); if (!e.isDir && !(ev.ctrlKey || ev.metaKey)) open(e.path); }}
            onContextMenu={(ev) => { ev.preventDefault(); setMenu({ x: ev.clientX, y: ev.clientY, entry: e }); }}
            draggable
            onDragStart={() => setDrag({ from: e.path })}
            onDragOver={(ev) => { ev.preventDefault(); }}
            onDrop={() => {
              if (drag?.from && drag.from !== e.path) {
                const to = e.isDir ? (e.path + '/' + drag.from.split('/').pop()) : e.path + '.moved';
                try { (window as any).rainvibe?.renamePath?.(drag.from, to); refresh(); } catch {}
              }
              setDrag(null);
            }}
            role="treeitem"
            aria-selected={selected.has(e.path)}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${selected.has(e.path) ? 'bg-white/10' : 'hover:bg-white/10'}`}
            title={e.path}
          >
            <span className="opacity-60">{e.isDir ? '📁' : '📄'}</span>
            <span>{e.name}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className="opacity-60">No entries</div>}
      </div>
      {menu && (
        <div style={{ left: menu.x, top: menu.y }} className="fixed z-50 bg-black border border-white/15 rounded text-xs shadow-xl">
          <button className="block w-full text-left px-3 py-1 hover:bg-white/10" onClick={() => { const p = prompt('New file path (relative)', menu.entry?.isDir ? (menu.entry.path + '/new-file.txt') : 'new-file.txt'); if (p) { try { (window as any).rainvibe?.writeTextFile?.(p, ''); refresh(); } catch {} } setMenu(null); }}>New File…</button>
          <button className="block w-full text-left px-3 py-1 hover:bg-white/10" onClick={() => { const p = prompt('New folder path (relative)', menu.entry?.isDir ? (menu.entry.path + '/new-folder') : 'new-folder'); if (p) { try { (window as any).rainvibe?.mkdir?.(p); refresh(); } catch {} } setMenu(null); }}>New Folder…</button>
          {menu.entry && (
            <>
              <button className="block w-full text-left px-3 py-1 hover:bg-white/10" onClick={() => { const to = prompt('Rename to (relative path)', menu.entry!.path); if (to && to !== menu.entry!.path) { try { (window as any).rainvibe?.renamePath?.(menu.entry!.path, to); refresh(); } catch {} } setMenu(null); }}>Rename…</button>
              <button className="block w-full text-left px-3 py-1 hover:bg-white/10" onClick={() => { const ok = confirm(`Delete ${menu.entry!.path}?`); if (ok) { try { (window as any).rainvibe?.deletePath?.(menu.entry!.path); refresh(); } catch {} } setMenu(null); }}>Delete</button>
              <button className="block w-full text-left px-3 py-1 hover:bg-white/10" onClick={() => { try { (window as any).rainvibe?.revealInOS?.(menu.entry!.path); } catch {} setMenu(null); }}>Reveal in OS</button>
              <button className="block w-full text-left px-3 py-1 hover:bg-white/10" onClick={() => { const paths = Array.from(selected.size ? selected : new Set([menu.entry!.path])); const folder = prompt('Move selected to folder (relative):', ''); if (folder != null) { try { paths.forEach(p => { const to = (folder ? (folder.replace(/\/$/, '') + '/' + p.split('/').pop()) : p); (window as any).rainvibe?.renamePath?.(p, to); }); refresh(); } catch {} } setMenu(null); }}>Move Selected…</button>
            </>
          )}
          <button className="block w-full text-left px-3 py-1 hover:bg-white/10" onClick={() => { refresh(); setMenu(null); }}>Refresh</button>
        </div>
      )}
    </div>
  );
};

export default WorkspaceTree;

