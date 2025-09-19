import React from 'react';
import { useFlows } from '../state/useFlows';
import ChatTab from './ChatTab';
import RunConsole from './RunConsole';
import BlameModal from './BlameModal';

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
  navOutline?: Array<{ line: number; text: string }>;
  onClearDiagnostics?: () => void;
  onOpenDiagnostic?: (line: number, column: number) => void;
}

const AssistantPanel: React.FC<Props> = ({ open, audit, diagnostics, onOpenPath, policyEnabled, onTogglePolicy, navImports, navOutline, onClearDiagnostics, onOpenDiagnostic }) => {
  const [tab, setTab] = React.useState<Tab>('Chat');
  const [severity, setSeverity] = React.useState<'all' | 'error' | 'warning' | 'info'>('all');
  React.useEffect(() => {
    const handler = (e: any) => {
      const t = (e?.detail as string) as Tab;
      if (t && (tabs as any).includes(t)) setTab(t);
    };
    window.addEventListener('rainvibe:assistantTab', handler as any);
    return () => window.removeEventListener('rainvibe:assistantTab', handler as any);
  }, []);
  if (!open) return null;
  const [blameOpen, setBlameOpen] = React.useState(false);
  const [blameText, setBlameText] = React.useState('');
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
              <button onClick={() => { try { (window as any).rainvibe?.clearAudit?.(); } catch {} }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Clear</button>
              <button onClick={() => {
                try {
                  const txt = (window as any).rainvibe?.readTextFile?.('.rainvibe/trails.jsonl') || '';
                  const hash = (window as any).rainvibe?.sha256Hex?.(txt) || '';
                  const ts = new Date().toISOString().replace(/[:.]/g, '-');
                  (window as any).rainvibe?.writeTextFile?.(`.rainvibe/exports/audit-${ts}.sha256.txt`, hash);
                  (window as any).rainvibe?.revealInOS?.('.rainvibe/exports');
                  alert('Audit exported with SHA-256: ' + hash.slice(0,16) + '…');
                } catch {}
              }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Sign</button>
            </div>
            <div className="space-y-1">
              {(audit?.events ?? []).map(e => (
                <div key={e.id} className="border border-white/10 rounded px-2 py-1">{new Date(e.ts).toLocaleString()} — {e.kind}</div>
              ))}
              {(audit?.events?.length ?? 0) === 0 && <div>No audit events yet.</div>}
            </div>
          </div>
        )}
        {tab === 'Run' && (
          <div className="flex flex-col gap-2 h-full">
            <div className="flex flex-wrap gap-2 p-2 border-b border-white/10">
              {(() => {
                try {
                  const scripts = (window as any).rainvibe?.readPackageScripts?.() || [];
                  return scripts.map((s: string) => (
                    <button key={s} onClick={() => window.dispatchEvent(new CustomEvent('rainvibe:run-script', { detail: s }))} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">{s}</button>
                  ));
                } catch { return null; }
              })()}
            </div>
            <RunConsole />
          </div>
        )}
        {tab === 'Diagnostics' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button onClick={onClearDiagnostics} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Clear</button>
              <span className="opacity-70 text-xs">Filter:</span>
              {['all','error','warning','info'].map(s => (
                <button key={s} onClick={() => setSeverity(s as any)} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">{s}</button>
              ))}
              <button onClick={() => {
                try {
                  const p = (window as any).activePath || '';
                  const text = p ? ((window as any).rainvibe?.readTextFile?.(p) || '') : '';
                  const issues = (window as any).rainvibe?.lintWithEslint?.(text, p || 'file.ts') || [];
                  alert(issues.map((i:any) => `${i.severity} ${i.line}:${i.column} ${i.message}`).join('\n') || 'No issues');
                } catch {}
              }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">Run Lint</button>
              <button onClick={() => {
                try {
                  const p = (window as any).activePath || '';
                  const text = p ? ((window as any).rainvibe?.readTextFile?.(p) || '') : '';
                  const fmt = (window as any).rainvibe?.formatWithPrettier?.(text, p || 'file.ts');
                  if (fmt != null && p) { (window as any).rainvibe?.writeTextFile?.(p, fmt); alert('Formatted with Prettier'); }
                  else { alert('Formatter not available'); }
                } catch {}
              }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">Format</button>
              <button onClick={() => { try { window.dispatchEvent(new CustomEvent('rainvibe:quick-fix')); } catch {} }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">Quick Fixes</button>
            </div>
            <div className="space-y-1">
              {(diagnostics ?? []).filter(d => severity==='all' || d.severity===severity).map((d, i) => (
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
            <div className="border border-white/10 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="opacity-70 text-xs">Conflicts</div>
                <button onClick={() => setTab('Changes')} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">Refresh</button>
              </div>
              {(() => {
                try {
                  const list = (window as any).rainvibe?.detectConflicts?.() || [];
                  if (!list.length) return <div className="opacity-60 text-xs">No conflicts detected</div>;
                  return (
                    <div className="space-y-1">
                      {list.map((c:any) => (
                        <div key={c.file} className="flex items-center justify-between border border-white/10 rounded px-2 py-1 text-xs">
                          <span><span className="opacity-70 mr-2">{c.lines} marks</span>{c.file}</span>
                          <span className="flex gap-1">
                            <button onClick={() => { (window as any).rainvibe?.resolveConflict?.(c.file, 'ours'); alert('Applied ours'); }} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Ours</button>
                            <button onClick={() => { (window as any).rainvibe?.resolveConflict?.(c.file, 'theirs'); alert('Applied theirs'); }} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Theirs</button>
                            <button onClick={() => { (window as any).rainvibe?.gitAdd?.(c.file); }} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Mark Resolved</button>
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                } catch { return <div className="opacity-60 text-xs">No conflicts detected</div>; }
              })()}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTab('Changes')} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Refresh</button>
              <button onClick={() => (window as any).rainvibe?.gitAdd?.()} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Stage All</button>
              <button onClick={() => { const m = prompt('Commit message:'); if (m) (window as any).rainvibe?.gitCommit?.(m); }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Commit…</button>
              <button onClick={() => { const msg = prompt('Stash message (optional):') || undefined; (window as any).rainvibe?.gitStash?.(msg); }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Stash…</button>
              <button onClick={() => { const b = prompt('Create branch:'); if (b) (window as any).rainvibe?.gitCheckout?.(b, true); }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">New Branch…</button>
              <button onClick={() => { const b = prompt('Switch to branch:'); if (b) (window as any).rainvibe?.gitCheckout?.(b, false); }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Switch Branch…</button>
              <button onClick={() => (window as any).rainvibe?.gitInit?.()} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Init Repo</button>
              <button onClick={() => { try { const c = (window as any).rainvibe?.detectConflicts?.() || []; alert(c.length ? c.map((x:any)=>`${x.file} (${x.lines})`).join('\n') : 'No conflicts'); } catch {} }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Detect Conflicts</button>
              <button onClick={() => { const onto = prompt('Rebase onto:'); if (onto) (window as any).rainvibe?.gitRebase?.(onto); }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Rebase…</button>
              <button onClick={() => (window as any).rainvibe?.gitRebaseContinue?.()} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Rebase Continue</button>
              <button onClick={() => (window as any).rainvibe?.gitRebaseAbort?.()} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Rebase Abort</button>
            </div>
            <div className="space-y-1">
              {(() => {
                try {
                  const entries = (window as any).rainvibe?.gitStatus?.() || [];
                  if (!entries.length) return <div className="opacity-60">No changes</div>;
                  const conflicts = (window as any).rainvibe?.detectConflicts?.() || [];
                  const conflictSet = new Set(conflicts.map((c:any) => c.file));
                  return entries.map((e: any, i: number) => (
                    <div key={i} className="border border-white/10 rounded px-2 py-1 text-xs hover:bg-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <button className="text-left flex-1 hover:underline" onClick={() => onOpenPath && onOpenPath(e.path)}>
                          <span className="opacity-70 mr-2">{e.status}</span>
                          {e.path}
                          {conflictSet.has(e.path) && (
                            <span className="ml-2 px-1 py-0.5 text-[10px] rounded bg-red-600/30 border border-red-500/40">CONFLICT</span>
                          )}
                        </button>
                        <div className="flex items-center gap-1">
                          <button onClick={() => (window as any).rainvibe?.gitAdd?.(e.path)} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Stage</button>
                          <button onClick={() => (window as any).rainvibe?.gitRestore?.(e.path)} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Restore</button>
                          <button onClick={() => window.dispatchEvent(new CustomEvent('rainvibe:diff-file', { detail: e.path }))} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Diff</button>
                          <button aria-label={`Blame ${e.path}`} onClick={() => { const out = (window as any).rainvibe?.gitBlame?.(e.path, 2000); if (out) { setBlameText(out); setBlameOpen(true); } else { alert('No blame'); } }} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Blame</button>
                          <button onClick={() => window.dispatchEvent(new CustomEvent('rainvibe:diff-hunks', { detail: e.path }))} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Hunks</button>
                          {conflictSet.has(e.path) && (
                            <>
                              <button onClick={() => { (window as any).rainvibe?.resolveConflict?.(e.path, 'ours'); alert('Applied ours'); }} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Ours</button>
                              <button onClick={() => { (window as any).rainvibe?.resolveConflict?.(e.path, 'theirs'); alert('Applied theirs'); }} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Theirs</button>
                              <button onClick={() => { (window as any).rainvibe?.gitAdd?.(e.path); alert('Marked resolved'); }} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Mark Resolved</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                } catch {
                  return <div className="opacity-60">No changes</div>;
                }
              })()}
            </div>
            <div className="space-y-1">
              <div className="opacity-70 text-xs">Stashes</div>
              {(() => {
                try {
                  const items = (window as any).rainvibe?.gitStashList?.() || [];
                  if (!items.length) return <div className="opacity-60 text-xs">No stashes</div>;
                  return items.map((s: any, i: number) => (
                    <div key={i} className="border border-white/10 rounded px-2 py-1 text-xs flex items-center justify-between">
                      <span>{s.name} — {s.message}</span>
                      <span className="flex gap-1">
                        <button onClick={() => (window as any).rainvibe?.gitStashApply?.(s.name)} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Apply</button>
                        <button onClick={() => (window as any).rainvibe?.gitStashDrop?.(s.name)} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Drop</button>
                      </span>
                    </div>
                  ));
                } catch { return null; }
              })()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="opacity-70 text-xs">Recent commits</div>
                <button onClick={() => window.dispatchEvent(new CustomEvent('rainvibe:diff-file-head', { detail: (window as any).activePath || '' }))} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs">Diff HEAD vs Worktree</button>
              </div>
              {(() => {
                try {
                  const list = (window as any).rainvibe?.gitLog?.(20) || [];
                  if (!list.length) return <div className="opacity-60 text-xs">No commits</div>;
                  return list.map((c: any) => (
                    <button key={c.hash} onClick={() => {
                      const txt = (window as any).rainvibe?.gitShowCommit?.(c.hash) || '';
                      alert(txt.slice(0, 4000));
                    }} className="w-full text-left border border-white/10 rounded px-2 py-1 hover:bg-white/10 text-xs">
                      <div className="font-mono opacity-70">{c.hash.slice(0,7)} — {new Date(c.date).toLocaleString()}</div>
                      <div>{c.subject}</div>
                    </button>
                  ));
                } catch { return null; }
              })()}
            </div>
          </div>
        )}
        {tab === 'Kits' && (
          <div className="space-y-2">
            <div>
              <button onClick={() => setTab('Kits')} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Refresh</button>
              <button onClick={() => { const name = prompt('Install kit name'); if (name) { const ok = (window as any).rainvibe?.installKit?.(name, `# ${name}\nInstalled at ${new Date().toISOString()}`); if (ok) setTab('Kits'); } }} className="ml-2 px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Install…</button>
            </div>
            <div className="space-y-1">
              {(() => {
                try {
                  const kits = (window as any).rainvibe?.listKits?.() || [];
                  if (!kits.length) return <div className="opacity-60 text-xs">No kits installed</div>;
                  return kits.map((k: string) => (
                    <div key={k} className="border border-white/10 rounded px-2 py-1 text-xs flex items-center justify-between">
                      <span>{k}</span>
                      <button onClick={() => { const ok = confirm(`Remove kit ${k}?`); if (ok) { (window as any).rainvibe?.removeKit?.(k); setTab('Kits'); } }} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Remove</button>
                    </div>
                  ));
                } catch { return <div className="opacity-60 text-xs">No kits installed</div>; }
              })()}
            </div>
          </div>
        )}
        {tab === 'Navigation' && (
          <div className="space-y-2">
            <div className="opacity-70 text-xs mb-1">Outline</div>
            <div className="space-y-1">
              {(navOutline ?? []).map((o, i) => (
                <button key={i} onClick={() => onOpenDiagnostic?.(o.line, 1)} className="w-full text-left border border-white/10 rounded px-2 py-1 hover:bg-white/10 text-xs">
                  <span className="opacity-60 mr-2">{o.line}</span>
                  {o.text}
                </button>
              ))}
              {(navOutline?.length ?? 0) === 0 && <div className="opacity-60 text-xs">No outline symbols</div>}
            </div>
            <div className="opacity-70 text-xs mt-2">Imports</div>
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
            <div className="space-y-1">
              <div className="opacity-70 text-xs">Hints</div>
              {(() => {
                try {
                  const hints = (window as any).rainvibe?.policyHints?.() || [];
                  if (!hints.length) return <div className="opacity-60 text-xs">No hints available</div>;
                  return hints.map((h: string, i: number) => (
                    <div key={i} className="border border-white/10 rounded px-2 py-1 text-xs">{h}</div>
                  ));
                } catch { return <div className="opacity-60 text-xs">No hints available</div>; }
              })()}
            </div>
            <div className="space-y-1">
              <div className="opacity-70 text-xs">Violations (changed files)</div>
              {(() => {
                try {
                  const list = (window as any).rainvibe?.policyCheckChanged?.() || [];
                  if (!list.length) return <div className="opacity-60 text-xs">No violations</div>;
                  return list.map((v: any, i: number) => (
                    <div key={i} className="border border-white/10 rounded px-2 py-1 text-xs">
                      <span className="opacity-70">{v.file}:{v.line}</span> — {v.message}
                    </div>
                  ));
                } catch { return <div className="opacity-60 text-xs">No violations</div>; }
              })()}
            </div>
          </div>
        )}
      </div>
      <BlameModal open={blameOpen} text={blameText} onClose={() => setBlameOpen(false)} />
    </div>
  );
};

export default AssistantPanel;

