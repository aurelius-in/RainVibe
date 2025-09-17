import React from 'react';
import ModeToggle from './components/ModeToggle';
import EditorHost from './editor/EditorHost';
import { useBuffers } from './state/useBuffers';
import { useModes } from './state/useModes';
import AssistantPanel from './components/AssistantPanel';
import ActionBoard from './components/ActionBoard';
import PreferencesModal from './components/PreferencesModal';
import AboutModal from './components/AboutModal';
import WorkspaceTree from './components/WorkspaceTree';
import { usePolicy } from './state/usePolicy';
import { useAuditLog } from './state/useAuditLog';
import { exportHTML, exportJSONL, exportPDF } from '@rainvibe/audit/src/exports';
import { registry } from './commands/registry';

const TopBar: React.FC<{ modes: string[]; onChange: (m: string[]) => void; onOpenBoard: () => void; onToggleAssistant: () => void; }>
  = ({ modes, onChange, onOpenBoard, onToggleAssistant }) => {
  return (
    <div className="flex items-center justify-between px-3 h-10 border-b border-white/10 bg-black text-white">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-sm gradient-accent" />
        <span className="font-semibold tracking-wide">RainVibe</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="opacity-70">Modes:</span>
        <ModeToggle active={modes as any} onChange={(m) => onChange(m as any)} />
        <button onClick={onOpenBoard} className="ml-2 px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Action Board</button>
        <button onClick={onToggleAssistant} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Toggle Panel</button>
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ modes: string[]; policyOn: boolean; auditCount: number }>= ({ modes, policyOn, auditCount }) => {
  return (
    <div className="h-6 text-xs px-3 flex items-center gap-4 border-t border-white/10 bg-black text-white/80">
      <span>model: ChatGPT</span>
      <span>mode: {modes.join(' + ') || '—'}</span>
      <span>policy: {policyOn ? 'on' : 'off'}</span>
      <span>audit: {auditCount}</span>
      <span>tokens: 0%</span>
    </div>
  );
};

const App: React.FC = () => {
  const { buffers, activeId, update } = useBuffers();
  const active = buffers.find(b => b.id === activeId) ?? buffers[0];
  const { active: activeModes, update: setModes } = useModes();
  const { status: policy, toggle: togglePolicy } = usePolicy();
  const { events } = useAuditLog();
  const [assistantOpen, setAssistantOpen] = React.useState(true);
  const [boardOpen, setBoardOpen] = React.useState(false);
  const [prefsOpen, setPrefsOpen] = React.useState(false);
  const [aboutOpen, setAboutOpen] = React.useState(false);

  React.useEffect(() => {
    registry.register({ id: 'toggle-assistant', title: 'Toggle Assistant Panel', run: () => setAssistantOpen(v => !v) });
    registry.register({ id: 'mode-basic', title: 'Switch Mode: Basic', run: () => setModes(['Basic'] as any) });
    registry.register({ id: 'toggle-policy', title: 'Toggle Policy-Safe', run: () => togglePolicy() });
    registry.register({ id: 'open-preferences', title: 'Open Preferences', run: () => setPrefsOpen(true) });
    registry.register({ id: 'open-about', title: 'Open About', run: () => setAboutOpen(true) });
  }, [setModes, togglePolicy]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'i') { setAssistantOpen(v => !v); e.preventDefault(); }
      if (meta && e.key.toLowerCase() === 'k') { setBoardOpen(true); e.preventDefault(); }
      if (meta && ['1','2','3','4','5'].includes(e.key)) {
        const map: Record<string, string[]> = {
          '1': ['Basic'],
          '2': ['Coach'],
          '3': ['Bug Fixer'],
          '4': ['Policy-Safe'],
          '5': ['Compliance/Audit'],
        };
        setModes(map[e.key] as any);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setModes]);

  return (
    <div className="h-full w-full flex flex-col bg-black text-white">
      <TopBar
        modes={activeModes as any}
        onChange={(m) => setModes(m as any)}
        onOpenBoard={() => setBoardOpen(true)}
        onToggleAssistant={() => setAssistantOpen(v => !v)}
      />
      <div className="flex-1 grid grid-cols-[260px_minmax(0,1fr)_360px] grid-rows-[minmax(0,1fr)]">
        <aside className="border-r border-white/10 p-2">
          <div className="text-sm font-semibold mb-2">Workspace</div>
          <WorkspaceTree />
        </aside>
        <main className="p-0">
          <div className="h-full w-full bg-black">
            <EditorHost
              value={active.content}
              language={active.language}
              onChange={(v) => update(active.id, v)}
            />
          </div>
        </main>
        <aside className="border-l border-white/10 p-0">
          <AssistantPanel
            open={assistantOpen}
            audit={{
              events: events as any,
              onExport: (fmt) => {
                if (fmt === 'html') {
                  const html = exportHTML(events as any);
                  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
                  window.open(url);
                } else if (fmt === 'jsonl') {
                  const txt = exportJSONL(events as any);
                  const url = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
                  window.open(url);
                } else {
                  const bin = exportPDF(events as any);
                  const url = URL.createObjectURL(new Blob([bin], { type: 'application/pdf' }));
                  window.open(url);
                }
              }
            }}
          />
        </aside>
      </div>
      <StatusBar modes={activeModes as any} policyOn={policy.enabled} auditCount={events.length} />
      <ActionBoard
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
        commands={registry.getAll()}
      />
      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
};

export default App;

