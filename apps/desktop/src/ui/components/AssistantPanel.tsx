import React from 'react';
import ChatTab from './ChatTab';
import RunConsole from './RunConsole';

type Tab = 'Chat' | 'Tasks' | 'Modes' | 'Trails' | 'Run' | 'Diagnostics' | 'Changes' | 'Kits' | 'Guardrails';

const tabs: Tab[] = ['Chat', 'Tasks', 'Modes', 'Trails', 'Run', 'Diagnostics', 'Changes', 'Kits', 'Guardrails'];

interface Props {
  open: boolean;
  audit?: { events: Array<{ id: string; ts: number; kind: string }>; onExport: (fmt: 'html' | 'jsonl' | 'pdf') => void };
  diagnostics?: Array<{ message: string; severity: 'error' | 'warning' | 'info' }>;
  onOpenPath?: (path: string) => void;
  policyEnabled?: boolean;
  onTogglePolicy?: () => void;
}

const AssistantPanel: React.FC<Props> = ({ open, audit, diagnostics, onOpenPath, policyEnabled, onTogglePolicy }) => {
  const [tab, setTab] = React.useState<Tab>('Chat');
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
        {tab === 'Tasks' && <div>Tasks and Flows coming soon.</div>}
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
          <div className="space-y-1">
            {(diagnostics ?? []).map((d, i) => (
              <div key={i} className="border border-white/10 rounded px-2 py-1">
                <span className="opacity-70 mr-2">{d.severity}</span>
                {d.message}
              </div>
            ))}
            {(diagnostics?.length ?? 0) === 0 && <div className="opacity-60">No diagnostics</div>}
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
        {tab === 'Kits' && <div>Kits stub: installable add-ons will be shown here.</div>}
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

