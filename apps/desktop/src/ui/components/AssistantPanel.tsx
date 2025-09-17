import React from 'react';
import ChatTab from './ChatTab';

type Tab = 'Chat' | 'Tasks' | 'Modes' | 'Trails' | 'Run' | 'Diagnostics' | 'Changes' | 'Kits';

const tabs: Tab[] = ['Chat', 'Tasks', 'Modes', 'Trails', 'Run', 'Diagnostics', 'Changes', 'Kits'];

interface Props {
  open: boolean;
  audit?: { events: Array<{ id: string; ts: number; kind: string }>; onExport: (fmt: 'html' | 'jsonl' | 'pdf') => void };
}

const AssistantPanel: React.FC<Props> = ({ open, audit }) => {
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
        {tab === 'Run' && <div>Run Console stub. Execution wiring will come later.</div>}
        {tab === 'Diagnostics' && <div>Diagnostics stub: problems will be shown here.</div>}
        {tab === 'Changes' && <div>Changes stub: source control changes will be shown here.</div>}
        {tab === 'Kits' && <div>Kits stub: installable add-ons will be shown here.</div>}
      </div>
    </div>
  );
};

export default AssistantPanel;

