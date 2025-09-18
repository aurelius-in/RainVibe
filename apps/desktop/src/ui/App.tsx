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

const TopBar: React.FC<{ modes: string[]; version?: string; onChange: (m: string[]) => void; onOpenBoard: () => void; onToggleAssistant: () => void; }>
  = ({ modes, version, onChange, onOpenBoard, onToggleAssistant }) => {
  return (
    <div className="flex items-center justify-between px-3 h-10 border-b border-white/10 bg-black text-white">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-sm gradient-accent" />
        <span className="font-semibold tracking-wide">RainVibe{version ? ` v${version}` : ''}</span>
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

const StatusBar: React.FC<{ modes: string[]; policyOn: boolean; policyCount: number; auditCount: number; changesCount: number; dirtyCount?: number; caret?: { line: number; column: number }; language?: string; model: string; provider: string; offline: boolean; tokensPct: number; tokenMeter?: boolean; onClickPolicy?: () => void; onClickAudit?: () => void; onClickModel?: () => void; onClickChanges?: () => void; onClickTokens?: () => void }>= ({ modes, policyOn, policyCount, auditCount, changesCount, dirtyCount, caret, language, model, provider, offline, tokensPct, tokenMeter, onClickPolicy, onClickAudit, onClickModel, onClickChanges, onClickTokens }) => {
  return (
    <div className="h-6 text-xs px-3 flex items-center gap-4 border-t border-white/10 bg-black text-white/80">
      <button onClick={onClickModel} className="underline-offset-2 hover:underline">model: {model}</button>
      <span>provider: {provider}{offline ? ' (offline)' : ''}</span>
      <span>mode: {modes.join(' + ') || '—'}</span>
      <button onClick={onClickPolicy} className="underline-offset-2 hover:underline">policy: {policyOn ? `on (${policyCount})` : 'off'}</button>
      <button onClick={onClickAudit} className="underline-offset-2 hover:underline">audit: {auditCount}</button>
      <button onClick={onClickChanges} className="underline-offset-2 hover:underline">changes: {changesCount}</button>
      {typeof dirtyCount === 'number' && <span>dirty: {dirtyCount}</span>}
      {caret && <span>ln {caret.line}, col {caret.column}{language ? ` — ${language}` : ''}</span>}
      {tokenMeter !== false && (
        <button onClick={onClickTokens} className={`underline-offset-2 hover:underline ${tokensPct > 80 ? 'text-red-400' : tokensPct > 60 ? 'text-yellow-300' : ''}`}>
          tokens: {Math.min(100, Math.max(0, Math.round(tokensPct)))}%
        </button>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { buffers, activeId, setActiveId, update, save, newBuffer, open, closeOthers, closeAll, close } = useBuffers();
  const active = buffers.find(b => b.id === activeId) ?? buffers[0];
  const { active: activeModes, update: setModes } = useModes();
  const { status: policy, toggle: togglePolicy } = usePolicy();
  const { events } = useAuditLog();
  const { prefs, save } = usePreferences();
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
  const [caret, setCaret] = React.useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [diagnostics, setDiagnostics] = React.useState<Array<{ message: string; severity: 'error' | 'warning' | 'info'; startLine: number; startColumn: number; endLine: number; endColumn: number }>>([]);
  const [changesCount, setChangesCount] = React.useState<number>(0);
  const dirtyCount = React.useMemo(() => buffers.filter(b => b.content !== (b.savedContent ?? '')).length, [buffers]);
  React.useEffect(() => {
    try { document.title = `RainVibe — ${active?.path ?? ''}`; } catch {}
  }, [active?.path]);
  React.useEffect(() => {
    try { localStorage.setItem('rainvibe.ui.assistantOpen', String(assistantOpen)); } catch {}
  }, [assistantOpen]);

  React.useEffect(() => {
    const modeHandler = (e: any) => {
      const name = String(e?.detail || '');
      if (!name) return;
      if (['Basic','Coach','Bug Fixer','Policy-Safe','Compliance/Audit'].includes(name)) setModes([name] as any);
    };
    const insertHandler = (e: any) => {
      const text = String(e?.detail || '');
      if (!text) return;
      // store for command to pull
      try { localStorage.setItem('rainvibe.chat.last', text); } catch {}
    };
    const selectionHandler = () => {
      // no-op: selection stored via command
    };
    window.addEventListener('rainvibe:switch-mode', modeHandler as any);
    window.addEventListener('rainvibe:insert-text', insertHandler as any);
    window.addEventListener('rainvibe:get-selection', selectionHandler as any);
    return () => {
      window.removeEventListener('rainvibe:switch-mode', modeHandler as any);
      window.removeEventListener('rainvibe:insert-text', insertHandler as any);
      window.removeEventListener('rainvibe:get-selection', selectionHandler as any);
    };
  }, [setModes]);

  React.useEffect(() => {
    // Simple diagnostics: mark TODO as warning, FIXME as error, NOTE as info
    const source = active?.content || '';
    const lines = source.split('\n');
    const next: Array<{ message: string; severity: 'error' | 'warning' | 'info'; startLine: number; startColumn: number; endLine: number; endColumn: number }> = [];
    lines.forEach((line, idx) => {
      if (line.includes('FIXME')) {
        next.push({ message: 'Contains FIXME', severity: 'error', startLine: idx + 1, startColumn: 1, endLine: idx + 1, endColumn: Math.max(1, line.length) });
      } else if (line.includes('TODO')) {
        next.push({ message: 'Contains TODO', severity: 'warning', startLine: idx + 1, startColumn: 1, endLine: idx + 1, endColumn: Math.max(1, line.length) });
      } else if (line.includes('NOTE')) {
        next.push({ message: 'Contains NOTE', severity: 'info', startLine: idx + 1, startColumn: 1, endLine: idx + 1, endColumn: Math.max(1, line.length) });
      }
    });
    setDiagnostics(next);
  }, [active?.content]);

  const tokensPct = React.useMemo(() => {
    const len = (active?.content || '').length;
    return Math.min(100, (len / 4000) * 100);
  }, [active?.content]);

  React.useEffect(() => {
    try {
      const entries = (window as any).rainvibe?.gitStatus?.() || [];
      setChangesCount(entries.length);
    } catch { setChangesCount(0); }
  }, []);
    registry.register({ id: 'toggle-assistant', title: 'Toggle Assistant Panel', run: () => { setAssistantOpen(v => !v); try { (window as any).rainvibe?.appendAudit?.(JSON.stringify({ kind:'toggle_assistant', ts: Date.now() })+'\n'); } catch {} } });
    registry.register({ id: 'mode-basic', title: 'Switch Mode: Basic', run: () => { setModes(['Basic'] as any); try { (window as any).rainvibe?.appendAudit?.(JSON.stringify({ kind:'switch_mode', mode:'Basic', ts: Date.now() })+'\n'); } catch {} } });
    registry.register({ id: 'toggle-policy', title: 'Toggle Policy-Safe', run: () => {
      if (activeModes.includes('Basic')) return; // disabled in Basic
      togglePolicy();
    }});
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
    registry.register({ id: 'reveal-in-workspace', title: 'Reveal in Workspace', run: () => {
      const name = active?.path?.split('/')?.pop() || '';
      window.dispatchEvent(new CustomEvent('rainvibe:filter', { detail: name }));
      setLeftRail('workspace');
    }});
    registry.register({ id: 'clear-workspace-filter', title: 'Clear Workspace Filter', run: () => {
      window.dispatchEvent(new CustomEvent('rainvibe:filter', { detail: '' }));
    }});
    registry.register({ id: 'open-recent', title: 'Open Recent…', run: () => {
      try {
        const arr = JSON.parse(localStorage.getItem('rainvibe.recent') || '[]') as string[];
        const choice = prompt('Recent files:\n' + arr.join('\n') + '\n\nEnter exact path to open:');
        if (choice) open(choice);
      } catch {}
    }});
    registry.register({ id: 'copy-path', title: 'Copy File Path', run: async () => {
      try { await navigator.clipboard.writeText(active?.path || ''); } catch {}
    }});
    registry.register({ id: 'refresh-changes', title: 'Refresh Changes Count', run: () => {
      try {
        const entries = (window as any).rainvibe?.gitStatus?.() || [];
        setChangesCount(entries.length);
        window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Changes' }));
      } catch {}
    }});
    registry.register({ id: 'new-buffer', title: 'New Buffer', run: () => newBuffer() });
    registry.register({ id: 'close-buffer', title: 'Close Current Tab', run: () => { if (activeId) close(activeId); } });
    registry.register({ id: 'close-others', title: 'Close Other Tabs', run: () => { if (activeId) closeOthers(activeId); } });
    registry.register({ id: 'close-all', title: 'Close All Tabs', run: () => { closeAll(); } });
    registry.register({ id: 'save-buffer', title: 'Save Buffer', run: () => { save(activeId); try { (window as any).rainvibe?.appendAudit?.(JSON.stringify({ kind:'save', path: active?.path, ts: Date.now() })+'\n'); } catch {} } });
    registry.register({ id: 'save-all', title: 'Save All Buffers', run: () => { try { buffers.forEach(b => { (window as any).rainvibe?.writeTextFile?.(b.path, b.content); }); } catch {} } });
    registry.register({ id: 'open-shortcuts', title: 'Open Shortcuts', run: () => setShortcutsOpen(true) });
    registry.register({ id: 'toggle-minimap', title: 'Toggle Minimap', run: () => {
      try { save({ ...prefs, minimap: !prefs.minimap }); } catch {}
    }});
    registry.register({ id: 'toggle-ghost-text', title: 'Toggle Ghost Text', run: () => {
      try { save({ ...prefs, ghostText: !prefs.ghostText }); } catch {}
    }});
    registry.register({ id: 'toggle-offline', title: 'Toggle Offline Only', run: () => {
      try { save({ ...prefs, offlineOnly: !prefs.offlineOnly }); } catch {}
    }});
    registry.register({ id: 'toggle-word-wrap', title: 'Toggle Word Wrap', run: () => {
      try { save({ ...prefs, wordWrap: !prefs.wordWrap }); } catch {}
    }});
    registry.register({ id: 'toggle-line-numbers', title: 'Toggle Line Numbers', run: () => {
      try { save({ ...prefs, lineNumbers: !prefs.lineNumbers }); } catch {}
    }});
    registry.register({ id: 'toggle-whitespace', title: 'Toggle Render Whitespace', run: () => {
      try { save({ ...prefs, renderWhitespace: !prefs.renderWhitespace }); } catch {}
    }});
    registry.register({ id: 'toggle-token-meter', title: 'Toggle Token Meter', run: () => {
      try { save({ ...prefs, tokenMeter: !prefs.tokenMeter }); } catch {}
    }});
    registry.register({ id: 'zoom-in', title: 'Zoom In', run: () => { try { save({ ...prefs, fontSize: Math.min(28, (prefs.fontSize ?? 14) + 1) }); } catch {} } });
    registry.register({ id: 'zoom-out', title: 'Zoom Out', run: () => { try { save({ ...prefs, fontSize: Math.max(10, (prefs.fontSize ?? 14) - 1) }); } catch {} } });
    registry.register({ id: 'zoom-reset', title: 'Zoom Reset', run: () => { try { save({ ...prefs, fontSize: 14 }); } catch {} } });
    registry.register({ id: 'toggle-left-rail', title: 'Toggle Left Rail', run: () => {
      const next = leftRail === 'workspace' ? 'search' : 'workspace';
      setLeftRail(next);
      try { localStorage.setItem('rainvibe.ui.leftRail', next); } catch {}
    }});
    registry.register({ id: 'focus-editor', title: 'Focus Editor', run: () => window.dispatchEvent(new CustomEvent('rainvibe:goto', { detail: { line: 1, col: 1 } } as any)) });
    registry.register({ id: 'clear-recent', title: 'Clear Recent Files', run: () => { try { localStorage.removeItem('rainvibe.recent'); } catch {} } });
    registry.register({ id: 'refresh-workspace', title: 'Refresh Workspace', run: () => window.dispatchEvent(new CustomEvent('rainvibe:workspace:refresh')) });
    registry.register({ id: 'new-folder', title: 'New Folder…', run: () => {
      const p = prompt('New folder path (relative):');
      if (!p) return;
      try { (window as any).rainvibe?.mkdir?.(p); window.dispatchEvent(new CustomEvent('rainvibe:workspace:refresh')); } catch {}
    }});
    registry.register({ id: 'rename-current-file', title: 'Rename Current File…', run: () => {
      if (!active?.path) return;
      const to = prompt('Rename to (relative path):', active.path);
      if (!to || to === active.path) return;
      try {
        const ok = (window as any).rainvibe?.renamePath?.(active.path, to);
        if (ok) {
          // Reload buffer with new path
          const txt = (window as any).rainvibe?.readTextFile?.(to) ?? active.content;
          update(active.id, String(txt));
          window.dispatchEvent(new CustomEvent('rainvibe:workspace:refresh'));
        }
      } catch {}
    }});
    registry.register({ id: 'delete-current-file', title: 'Delete Current File…', run: () => {
      if (!active?.path) return;
      const ok = confirm(`Delete ${active.path}?`);
      if (!ok) return;
      try { (window as any).rainvibe?.deletePath?.(active.path); close(active.id); window.dispatchEvent(new CustomEvent('rainvibe:workspace:refresh')); } catch {}
    }});
    registry.register({ id: 'reveal-current-in-os', title: 'Reveal Current File in OS', run: () => { if (active?.path) { try { (window as any).rainvibe?.revealInOS?.(active.path); } catch {} } }});
    registry.register({ id: 'switch-provider-local', title: 'Switch Provider: Local', run: () => { try { save({ ...prefs, provider: 'local' }); } catch {} } });
    registry.register({ id: 'switch-provider-chatgpt', title: 'Switch Provider: ChatGPT', run: () => { try { save({ ...prefs, provider: 'chatgpt' }); } catch {} } });
    registry.register({ id: 'replace-in-file', title: 'Replace in File…', run: () => trigger('editor.action.startFindReplaceAction') });
    registry.register({ id: 'toggle-line-comment', title: 'Toggle Line Comment', run: () => trigger('editor.action.commentLine') });
    registry.register({ id: 'toggle-block-comment', title: 'Toggle Block Comment', run: () => trigger('editor.action.blockComment') });
    registry.register({ id: 'select-occurrences', title: 'Select All Occurrences', run: () => trigger('editor.action.selectHighlights') });
    registry.register({ id: 'format-selection', title: 'Format Selection', run: () => trigger('editor.action.formatSelection') });
    registry.register({ id: 'open-welcome', title: 'Open Welcome Buffer', run: () => open('WELCOME.ts') });
    registry.register({ id: 'open-file', title: 'Open File…', run: () => {
      const path = prompt('Enter relative path to open:');
      if (path) open(path);
    }});
    registry.register({ id: 'generate-feature-report', title: 'Generate Feature Coverage Report', run: () => {
      fetch('/scripts/feature-report.mjs').catch(() => {});
      alert('Run `pnpm report` to generate FEATURE_COVERAGE.md');
    }});
    registry.register({ id: 'new-flow-item', title: 'Flows: Add Task', run: () => {
      const title = prompt('Task title');
      const input = document.getElementById('flows-new') as HTMLInputElement | null;
      if (title && input) { input.value = title; const click = input.nextElementSibling as HTMLButtonElement | null; click?.click(); }
    }});
    registry.register({ id: 'open-diagnostics-tab', title: 'Open Diagnostics Tab', run: () => {
      window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Diagnostics' }));
    }});
    registry.register({ id: 'open-trails-tab', title: 'Open Trails Tab', run: () => {
      window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Trails' }));
    }});
    registry.register({ id: 'open-guardrails-tab', title: 'Open Guardrails Tab', run: () => {
      window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Guardrails' }));
    }});
    registry.register({ id: 'open-run-tab', title: 'Open Run Console Tab', run: () => {
      window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Run' }));
    }});
    registry.register({ id: 'open-chat-tab', title: 'Open Chat Tab', run: () => {
      window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Chat' }));
    }});
    registry.register({ id: 'open-modes-tab', title: 'Open Modes Tab', run: () => {
      window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Modes' }));
    }});
    registry.register({ id: 'open-readme', title: 'Open README.md', run: () => {
      try {
        const ok = open('README.md');
        if (!ok) {
          const md = (window as any).rainvibe?.readReadme?.() as string | null;
          if (md != null) {
            const name = 'README.md';
            (window as any).rainvibe?.writeTextFile?.(name, md);
            open(name);
          }
        }
      } catch {}
    }});
    registry.register({ id: 'new-file', title: 'New File…', run: () => {
      const p = prompt('New file path (relative):');
      if (!p) return;
      try { (window as any).rainvibe?.writeTextFile?.(p, ''); open(p); } catch {}
    }});
    registry.register({ id: 'open-exports-folder', title: 'Open Exports Folder', run: () => {
      try { (window as any).rainvibe?.revealInOS?.('.rainvibe/exports'); } catch {}
    }});
    registry.register({ id: 'open-org-folder', title: 'Open Org Pack Folder', run: () => {
      try { (window as any).rainvibe?.revealInOS?.('.rainvibe'); } catch {}
    }});
  }, [setModes, togglePolicy]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'i') { setAssistantOpen(v => !v); e.preventDefault(); }
      if (meta && e.key.toLowerCase() === 'k') { setBoardOpen(true); e.preventDefault(); }
      if (meta && (!e.shiftKey) && e.key.toLowerCase() === 'p') { setBoardOpen(true); e.preventDefault(); }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'p') { setBoardOpen(true); e.preventDefault(); }
      if (meta && e.key.toLowerCase() === 's') { save(activeId); e.preventDefault(); }
      if (meta && e.shiftKey && e.key.toLowerCase() === 's') { try { buffers.forEach(b => { (window as any).rainvibe?.writeTextFile?.(b.path, b.content); }); } catch {}; e.preventDefault(); }
      if (meta && e.key.toLowerCase() === 'w') { // Close current
        if (e.shiftKey) { // Close others
          if (activeId) closeOthers(activeId);
        } else if (e.altKey) { // Close all
          closeAll();
        } else {
          if (activeId) close(activeId);
        }
        e.preventDefault();
      }
      if (e.key === 'F1') { setBoardOpen(true); e.preventDefault(); }
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
        version={(window as any).rainvibe?.version}
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
              minimap={prefs.minimap}
              fontSize={prefs.fontSize}
              wordWrap={!!prefs.wordWrap}
              lineNumbers={!!prefs.lineNumbers}
              renderWhitespace={!!prefs.renderWhitespace}
              onReady={({ revealPosition, trigger }) => {
                registry.register({ id: 'go-to-line', title: 'Go to Line…', run: () => {
                  const v = prompt('Line:Column');
                  if (!v) return;
                  const [lineStr, colStr] = v.split(':');
                  const line = parseInt(lineStr || '1', 10);
                  const col = parseInt(colStr || '1', 10);
                  revealPosition(line, col);
                }});
                registry.register({ id: 'format-document', title: 'Format Document', run: () => trigger('editor.action.formatDocument') });
                registry.register({ id: 'find-in-file', title: 'Find in File…', run: () => trigger('actions.find') });
                registry.register({ id: 'find-next', title: 'Find Next', run: () => trigger('editor.action.nextMatchFindAction') });
                registry.register({ id: 'find-previous', title: 'Find Previous', run: () => trigger('editor.action.previousMatchFindAction') });
                registry.register({ id: 'copy-line', title: 'Copy Line', run: () => trigger('editor.action.clipboardCopyAction') });
                registry.register({ id: 'duplicate-line', title: 'Duplicate Line', run: () => trigger('editor.action.copyLinesDownAction') });
                registry.register({ id: 'delete-line', title: 'Delete Line', run: () => trigger('editor.action.deleteLines') });
                registry.register({ id: 'move-line-up', title: 'Move Line Up', run: () => trigger('editor.action.moveLinesUpAction') });
                registry.register({ id: 'move-line-down', title: 'Move Line Down', run: () => trigger('editor.action.moveLinesDownAction') });
                registry.register({ id: 'select-line', title: 'Select Line', run: () => trigger('expandLineSelection') });
                registry.register({ id: 'copy-selection', title: 'Copy Selection', run: () => trigger('editor.action.clipboardCopyAction') });
                registry.register({ id: 'trim-trailing-whitespace', title: 'Trim Trailing Whitespace', run: () => trigger('editor.action.trimTrailingWhitespace') });
                registry.register({ id: 'duplicate-buffer', title: 'Duplicate Buffer as Untitled', run: () => {
                  const name = `untitled-${Date.now()}.txt`;
                  newBuffer(name);
                  setActiveId(name);
                  update(name, active?.content || '');
                }});
              }}
              onCursorChange={(p) => setCaret(p)}
              onSelectionChange={(_text) => { /* no-op now */ }}
            />
          </div>
        </main>
        <aside className="border-l border-white/10 p-0">
          <AssistantPanel
            open={assistantOpen}
            diagnostics={diagnostics.map(d => ({ message: d.message, severity: d.severity, startLine: d.startLine, startColumn: d.startColumn }))}
            audit={{
              events: events as any,
              onExport: (fmt) => {
                const ts = new Date().toISOString().replace(/[:.]/g, '-');
                if (fmt === 'html') {
                  const html = exportHTML(events as any);
                  (window as any).rainvibe?.writeTextFile?.(`.rainvibe/exports/audit-${ts}.html`, html);
                } else if (fmt === 'jsonl') {
                  const txt = exportJSONL(events as any);
                  (window as any).rainvibe?.writeTextFile?.(`.rainvibe/exports/audit-${ts}.jsonl`, txt);
                } else {
                  const bin = exportPDF(events as any);
                  const b64 = btoa(String.fromCharCode(...Array.from(bin)));
                  (window as any).rainvibe?.writeBytesBase64?.(`.rainvibe/exports/audit-${ts}.pdf`, b64);
                }
                try { (window as any).rainvibe?.revealInOS?.('.rainvibe/exports'); } catch {}
              }
            }}
            onOpenPath={(p) => open(p)}
            policyEnabled={policy.enabled}
            onTogglePolicy={() => togglePolicy()}
            navImports={(active?.content.match(/import\s+[^;]+;/g) || []).map(s => s.trim())}
            onClearDiagnostics={() => setDiagnostics([])}
            onOpenDiagnostic={(line, col) => {
              // Create a command using last onReady
              const cmd = registry.getAll().find(c => c.id === 'go-to-line');
              // fallback: dispatch a prompt
              const evt = new CustomEvent('rainvibe:goto', { detail: { line, col } } as any);
              window.dispatchEvent(evt);
            }}
          />
        </aside>
      </div>
      <StatusBar
        modes={activeModes as any}
        policyOn={policy.enabled}
        policyCount={(policy as any)?.ruleFiles?.length ?? 0}
        auditCount={events.length}
        changesCount={changesCount}
        dirtyCount={dirtyCount}
        model={prefs.model}
        provider={prefs.provider}
        offline={!!prefs.offlineOnly}
        tokensPct={tokensPct}
        tokenMeter={prefs.tokenMeter}
        caret={caret}
        language={active.language}
        onClickPolicy={() => window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Guardrails' }))}
        onClickAudit={() => window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Trails' }))}
        onClickModel={() => setPrefsOpen(true)}
        onClickChanges={() => window.dispatchEvent(new CustomEvent('rainvibe:assistantTab', { detail: 'Changes' }))}
        onClickTokens={() => setPrefsOpen(true)}
      />
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

