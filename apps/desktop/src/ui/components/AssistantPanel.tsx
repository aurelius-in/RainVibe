import React from 'react';
import { useFlows } from '../state/useFlows';
import ChatTab from './ChatTab';
import RunConsole from './RunConsole';

type Tab = 'Chat' | 'Tasks' | 'Modes' | 'Trails' | 'Run' | 'Diagnostics' | 'Changes' | 'Kits' | 'Guardrails' | 'Navigation';

const tabs: Tab[] = ['Chat', 'Tasks', 'Modes', 'Trails', 'Run', 'Diagnostics', 'Changes', 'Kits', 'Guardrails', 'Navigation'];

interface Props {
  open: boolean;
  audit?: { events: Array<{ id: string; ts: number; kind: string }>; onExport: (fmt: 'html' | 'jsonl' | 'pdf') => void };
  diagnostics?: Array<{ message: string; severity: 'error' | 'warning' | 'info'; startLine?: number; startColumn?: number }>;
  onOpenPath?: (path: string) => void;
  policyEnabled?: boolean;
  onTogglePolicy?: () => void;
  navImports?: string[];
  onClearDiagnostics?: () => void;
  onOpenDiagnostic?: (line: number, column: number) => void;
}

const AssistantPanel: React.FC<Props> = ({ open, audit, diagnostics, onOpenPath, policyEnabled, onTogglePolicy, navImports, onClearDiagnostics, onOpenDiagnostic }) => {
  const [tab, setTab] = React.useState<Tab>('Chat');
  React.useEffect(() => {
    const handler = (e: any) => {
      const t = (e?.detail as string) as Tab;
      if (t && (tabs as any).includes(t)) setTab(t);
    };
    window.addEventListener('rainvibe:assistantTab', handler as any);
    return () => window.removeEventListener('rainvibe:assistantTab', handler as any);
  }, []);
  if (!open) return null;
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex gap-2 border-b border-white/10 px-2 h-8 items-center text-sm">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-0.5 rounded ${tab === t ? 'bg-white/20' : 'hover:bg-white/10'} border border-white/10`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 p-2 text-xs opacity-80">
        {tab === 'Chat' && <ChatTab />}
        {tab === 'Tasks' && (
          <div className="space-y-2">
            {(() => {
              const { items, add, toggle, remove } = useFlows();
              return (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input id="flows-new" placeholder="New task" className="flex-1 px-2 py-1 bg-black text-white border border-white/15 rounded" />
                    <button onClick={() => { const el = document.getElementById('flows-new') as HTMLInputElement | null; if (el && el.value.trim()) { add(el.value.trim()); el.value=''; } }} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10">Add</button>
                  </div>
                  <div className="space-y-1">
                    {items.map(i => (
                      <div key={i.id} className="flex items-center justify-between border border-white/10 rounded px-2 py-1 text-xs">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={i.done} onChange={() => toggle(i.id)} />
                          <span className={i.done ? 'line-through opacity-60' : ''}>{i.title}</span>
                        </label>
                        <button onClick={() => remove(i.id)} className="opacity-60 hover:opacity-100">Remove</button>
                      </div>
                    ))}
                    {items.length === 0 && <div className="opacity-60">No tasks</div>}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        {tab === 'Modes' && <div>Toggle and configure Modes here.</div>}
        {tab === 'Trails' && (
          <div>
            <div className="mb-2 flex gap-2">
              <button onClick={() => audit?.onExport('html')} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Export HTML</button>
              <button onClick={() => audit?.onExport('jsonl')} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Export JSONL</button>
              <button onClick={() => audit?.onExport('pdf')} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Export PDF</button>
            </div>
            <div className="space-y-1">
              {(audit?.events ?? []).map(e => (
                <div key={e.id} className="border border-white/10 rounded px-2 py-1">{new Date(e.ts).toLocaleString()} — {e.kind}</div>
              ))}
              {(audit?.events?.length ?? 0) === 0 && <div>No audit events yet.</div>}
            </div>
          </div>
        )}
        {tab === 'Run' && <RunConsole />}
        {tab === 'Diagnostics' && (
          <div className="space-y-2">
            <div>
              <button onClick={onClearDiagnostics} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Clear</button>
            </div>
            <div className="space-y-1">
              {(diagnostics ?? []).map((d, i) => (
                <button
                  key={i}
                  onClick={() => d.startLine && onOpenDiagnostic?.(d.startLine || 1, d.startColumn || 1)}
                  className="w-full text-left border border-white/10 rounded px-2 py-1 hover:bg-white/10"
                >
                  <span className="opacity-70 mr-2">{d.severity}</span>
                  {d.message}
                  {d.startLine ? <span className="opacity-50 ml-2">(line {d.startLine})</span> : null}
                </button>
              ))}
            {(diagnostics?.length ?? 0) === 0 && <div className="opacity-60">No diagnostics</div>}
            </div>
          </div>
        )}
        {tab === 'Changes' && (
          <div className="space-y-2">
            <button onClick={() => setTab('Changes')} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Refresh</button>
            <div className="space-y-1">
              {(() => {
                try {
                  const entries = (window as any).rainvibe?.gitStatus?.() || [];
                  if (!entries.length) return <div className="opacity-60">No changes</div>;
                  return entries.map((e: any, i: number) => (
                    <div key={i} className="border border-white/10 rounded px-2 py-1 text-xs hover:bg-white/10 cursor-pointer" onClick={() => onOpenPath && onOpenPath(e.path)}>
                      <span className="opacity-70 mr-2">{e.status}</span>
                      {e.path}
                    </div>
                  ));
                } catch {
                  return <div className="opacity-60">No changes</div>;
                }
              })()}
            </div>
          </div>
        )}
        {tab === 'Kits' && (
          <div className="space-y-1">
            {(() => {
              try {
                const kits = (window as any).rainvibe?.listKits?.() || [];
                if (!kits.length) return <div className="opacity-60 text-xs">No kits installed</div>;
                return kits.map((k: string) => <div key={k} className="border border-white/10 rounded px-2 py-1 text-xs">{k}</div>);
              } catch { return <div className="opacity-60 text-xs">No kits installed</div>; }
            })()}
          </div>
        )}
        {tab === 'Navigation' && (
          <div className="space-y-1">
            <div className="opacity-70 text-xs mb-1">Imports in active file</div>
            {(navImports ?? []).map((m, i) => (
              <div key={i} className="border border-white/10 rounded px-2 py-1 text-xs">{m}</div>
            ))}
            {(navImports?.length ?? 0) === 0 && <div className="opacity-60 text-xs">No imports detected</div>}
          </div>
        )}
        {tab === 'Guardrails' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">Policy-Safe:</span>
              <button onClick={onTogglePolicy} className={`px-2 py-0.5 border border-white/15 rounded ${policyEnabled ? 'bg-white/20' : 'hover:bg-white/10'}`}>{policyEnabled ? 'On' : 'Off'}</button>
            </div>
            <div className="space-y-1">
              {(() => {
                try {
                  const files = (window as any).rainvibe?.policyFiles?.() || [];
                  if (!files.length) return <div className="opacity-60 text-xs">No policy files</div>;
                  return files.map((p: string) => (
                    <div key={p} className="border border-white/10 rounded px-2 py-1 text-xs">{p}</div>
                  ));
                } catch { return <div className="opacity-60 text-xs">No policy files</div>; }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantPanel;

