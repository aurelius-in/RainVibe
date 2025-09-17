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
import SearchPanel from './components/SearchPanel';
import EditorTabs from './components/EditorTabs';
import { usePolicy } from './state/usePolicy';
import { useAuditLog } from './state/useAuditLog';
import { exportHTML, exportJSONL, exportPDF } from '@rainvibe/audit/src/exports';
import { registry } from './commands/registry';
import { usePreferences } from './state/usePreferences';
import FirstRunModal, { shouldShowFirstRun } from './components/FirstRunModal';
import DiffPatchPreview from './components/DiffPatchPreview';
import ShortcutsModal from './components/ShortcutsModal';

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

const StatusBar: React.FC<{ modes: string[]; policyOn: boolean; policyCount: number; auditCount: number; model: string; tokensPct: number }>= ({ modes, policyOn, policyCount, auditCount, model, tokensPct }) => {
  return (
    <div className="h-6 text-xs px-3 flex items-center gap-4 border-t border-white/10 bg-black text-white/80">
      <span>model: {model}</span>
      <span>mode: {modes.join(' + ') || '—'}</span>
      <span>policy: {policyOn ? `on (${policyCount})` : 'off'}</span>
      <span>audit: {auditCount}</span>
      <span>tokens: {Math.min(100, Math.max(0, Math.round(tokensPct)))}%</span>
    </div>
  );
};

const App: React.FC = () => {
  const { buffers, activeId, update, save, newBuffer, open } = useBuffers();
  const active = buffers.find(b => b.id === activeId) ?? buffers[0];
  const { active: activeModes, update: setModes } = useModes();
  const { status: policy, toggle: togglePolicy } = usePolicy();
  const { events } = useAuditLog();
  const { prefs } = usePreferences();
  const [assistantOpen, setAssistantOpen] = React.useState<boolean>(() => {
    try { return localStorage.getItem('rainvibe.ui.assistantOpen') !== 'false'; } catch { return true; }
  });
  const [boardOpen, setBoardOpen] = React.useState(false);
  const [prefsOpen, setPrefsOpen] = React.useState(false);
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [firstOpen, setFirstOpen] = React.useState(() => shouldShowFirstRun());
  const [leftRail, setLeftRail] = React.useState<'workspace' | 'search'>(() => {
    try { return (localStorage.getItem('rainvibe.ui.leftRail') as any) || 'workspace'; } catch { return 'workspace'; }
  });
  const [showDiff, setShowDiff] = React.useState(false);
  const [diffOriginal, setDiffOriginal] = React.useState('');
  const [diffModified, setDiffModified] = React.useState('');
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [diagnostics, setDiagnostics] = React.useState<Array<{ message: string; severity: 'error' | 'warning' | 'info'; startLine: number; startColumn: number; endLine: number; endColumn: number }>>([]);
  React.useEffect(() => {
    try { document.title = `RainVibe — ${active?.path ?? ''}`; } catch {}
  }, [active?.path]);
  React.useEffect(() => {
    try { localStorage.setItem('rainvibe.ui.assistantOpen', String(assistantOpen)); } catch {}
  }, [assistantOpen]);

  React.useEffect(() => {
    // Simple diagnostics: mark TODO as warning, FIXME as error
    const source = active?.content || '';
    const lines = source.split('\n');
    const next: Array<{ message: string; severity: 'error' | 'warning' | 'info'; startLine: number; startColumn: number; endLine: number; endColumn: number }> = [];
    lines.forEach((line, idx) => {
      if (line.includes('FIXME')) {
        next.push({ message: 'Contains FIXME', severity: 'error', startLine: idx + 1, startColumn: 1, endLine: idx + 1, endColumn: Math.max(1, line.length) });
      } else if (line.includes('TODO')) {
        next.push({ message: 'Contains TODO', severity: 'warning', startLine: idx + 1, startColumn: 1, endLine: idx + 1, endColumn: Math.max(1, line.length) });
      }
    });
    setDiagnostics(next);
  }, [active?.content]);

  const tokensPct = React.useMemo(() => {
    const len = (active?.content || '').length;
    return Math.min(100, (len / 4000) * 100);
  }, [active?.content]);
    registry.register({ id: 'toggle-assistant', title: 'Toggle Assistant Panel', run: () => { setAssistantOpen(v => !v); try { (window as any).rainvibe?.appendAudit?.(JSON.stringify({ kind:'toggle_assistant', ts: Date.now() })+'\n'); } catch {} } });
    registry.register({ id: 'mode-basic', title: 'Switch Mode: Basic', run: () => { setModes(['Basic'] as any); try { (window as any).rainvibe?.appendAudit?.(JSON.stringify({ kind:'switch_mode', mode:'Basic', ts: Date.now() })+'\n'); } catch {} } });
    registry.register({ id: 'toggle-policy', title: 'Toggle Policy-Safe', run: () => togglePolicy() });
    registry.register({ id: 'open-preferences', title: 'Open Preferences', run: () => setPrefsOpen(true) });
    registry.register({ id: 'open-about', title: 'Open About', run: () => setAboutOpen(true) });
    registry.register({ id: 'policy-simulate', title: 'Simulate Policy Check', run: () => {
      // Stub: just create an alert to show where results would surface
      alert('Policy simulation: all checks passed (stub).');
    }});
    registry.register({ id: 'open-patch-preview', title: 'Open Patch Preview', run: () => {
      setDiffOriginal(active?.content || '');
      setDiffModified((active?.content || '') + '\n// TODO: refine');
      setShowDiff(true);
    }});
    registry.register({ id: 'left-rail-workspace', title: 'Show Workspace', run: () => setLeftRail('workspace') });
    registry.register({ id: 'left-rail-search', title: 'Show Search', run: () => setLeftRail('search') });
    registry.register({ id: 'new-buffer', title: 'New Buffer', run: () => newBuffer() });
    registry.register({ id: 'save-buffer', title: 'Save Buffer', run: () => save(activeId) });
    registry.register({ id: 'open-shortcuts', title: 'Open Shortcuts', run: () => setShortcutsOpen(true) });
    registry.register({ id: 'open-file', title: 'Open File…', run: () => {
      const path = prompt('Enter relative path to open:');
      if (path) open(path);
    }});
    registry.register({ id: 'generate-feature-report', title: 'Generate Feature Coverage Report', run: () => {
      fetch('/scripts/feature-report.mjs').catch(() => {});
      alert('Run `pnpm report` to generate FEATURE_COVERAGE.md');
    }});
  }, [setModes, togglePolicy]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'i') { setAssistantOpen(v => !v); e.preventDefault(); }
      if (meta && e.key.toLowerCase() === 'k') { setBoardOpen(true); e.preventDefault(); }
      if (meta && e.key.toLowerCase() === 's') { save(activeId); e.preventDefault(); }
      if (meta && e.shiftKey && e.key === 'Enter') {
        setDiffOriginal(active?.content || '');
        setDiffModified((active?.content || '') + '\n// TODO: refine');
        setShowDiff(true);
        e.preventDefault();
      }
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
      if (e.key === 'Escape') { setBoardOpen(false); }
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
          <div className="text-sm font-semibold mb-2">Left Rail</div>
          <div className="flex gap-2 mb-2 text-xs">
            <button onClick={() => { setLeftRail('workspace'); try { localStorage.setItem('rainvibe.ui.leftRail', 'workspace'); } catch {} }} className={`px-2 py-0.5 border border-white/15 rounded ${leftRail==='workspace' ? 'bg-white/10' : 'hover:bg-white/10'}`}>Workspace</button>
            <button onClick={() => { setLeftRail('search'); try { localStorage.setItem('rainvibe.ui.leftRail', 'search'); } catch {} }} className={`px-2 py-0.5 border border-white/15 rounded ${leftRail==='search' ? 'bg-white/10' : 'hover:bg-white/10'}`}>Search</button>
          </div>
          {leftRail === 'workspace' ? <WorkspaceTree /> : <SearchPanel />}
        </aside>
        <main className="p-0">
          <div className="h-full w-full bg-black">
            <EditorTabs />
            <EditorHost
              value={active.content}
              language={active.language}
              onChange={(v) => update(active.id, v)}
              inlineAutocompleteEnabled={!!prefs.ghostText}
              diagnostics={diagnostics}
            />
          </div>
        </main>
        <aside className="border-l border-white/10 p-0">
          <AssistantPanel
            open={assistantOpen}
            diagnostics={diagnostics.map(d => ({ message: d.message, severity: d.severity }))}
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
            onOpenPath={(p) => open(p)}
            policyEnabled={policy.enabled}
            onTogglePolicy={() => togglePolicy()}
          />
        </aside>
      </div>
      <StatusBar modes={activeModes as any} policyOn={policy.enabled} policyCount={(policy as any)?.ruleFiles?.length ?? 0} auditCount={events.length} model={prefs.model} tokensPct={tokensPct} />
      <ActionBoard
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
        commands={registry.getAll()}
      />
      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <FirstRunModal open={firstOpen} onClose={() => setFirstOpen(false)} onOpenPreferences={() => setPrefsOpen(true)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

export default App;

