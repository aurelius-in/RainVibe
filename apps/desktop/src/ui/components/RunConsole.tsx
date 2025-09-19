import React from 'react';
import { simulateRun } from '@rainvibe/runtime';

const RunConsole: React.FC = () => {
  const [cmd, setCmd] = React.useState('echo Hello RainVibe');
  const [out, setOut] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const [pty, setPty] = React.useState(false);
  const [ptyId, setPtyId] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rainvibe.run.history') || '[]'); } catch { return []; }
  });
  const [hIdx, setHIdx] = React.useState<number>(-1);
  const onRun = async () => {
    setBusy(true);
    if (pty) {
      try {
        const id = (window as any).rainvibe?.runPtyStart?.(cmd);
        if (id) {
          setPtyId(id);
          const start = Date.now();
          const tick = () => {
            try {
              const chunk = (window as any).rainvibe?.runPtyPoll?.(id) || '';
              if (chunk) setOut((prev) => prev + chunk);
            } catch {}
            if (Date.now() - start < 60_000) setTimeout(tick, 250);
          };
          tick();
        }
      } catch {}
      setBusy(false);
      try { (window as any).rainvibe?.appendAudit?.(JSON.stringify({ kind:'run', cmd, ts: Date.now(), pty: true })+'\n'); } catch {}
      setHistory((prev) => [cmd, ...prev].slice(0, 50));
      setHIdx(-1);
      return;
    }
    let output = '';
    try {
      const res = (window as any).rainvibe?.runShell?.(cmd);
      if (res) output = res.output;
      else {
        const sim = await simulateRun(cmd);
        output = sim.output;
      }
    } catch {
      const sim = await simulateRun(cmd);
      output = sim.output;
    }
    setOut((prev) => prev + (prev ? '\n' : '') + output);
    setBusy(false);
    try { (window as any).rainvibe?.appendAudit?.(JSON.stringify({ kind:'run', cmd, ts: Date.now(), bytes: output?.length || 0 })+'\n'); } catch {}
    setHistory((prev) => [cmd, ...prev].slice(0, 50));
    setHIdx(-1);
  };
  React.useEffect(() => {
    try { localStorage.setItem('rainvibe.run.history', JSON.stringify(history)); } catch {}
  }, [history]);
  const onClear = () => setOut('');
  const onCopy = async () => { try { await navigator.clipboard.writeText(out); } catch {} };
  const onSaveOut = () => {
    try {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      (window as any).rainvibe?.writeTextFile?.(`.rainvibe/exports/run-${ts}.log`, out);
      (window as any).rainvibe?.revealInOS?.('.rainvibe/exports');
    } catch {}
  };
  React.useEffect(() => {
    const handler = (e: any) => {
      const name = String(e?.detail || '');
      if (name) setCmd(`npm run ${name}`);
    };
    window.addEventListener('rainvibe:run-script', handler as any);
    return () => window.removeEventListener('rainvibe:run-script', handler as any);
  }, []);
  return (
    <div className="h-full flex flex-col text-xs">
      <div className="flex gap-2">
        <label className="flex items-center gap-2 px-2 py-1 border border-white/15 rounded">
          <input type="checkbox" checked={pty} onChange={(e) => setPty(e.target.checked)} /> PTY
        </label>
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onRun(); }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHIdx((i) => {
              const ni = Math.min((i < 0 ? -1 : i) + 1, history.length - 1);
              const next = history[ni] ?? cmd;
              setCmd(next);
              return ni;
            });
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHIdx((i) => {
              const ni = Math.max((i < 0 ? -1 : i) - 1, -1);
              const next = ni >= 0 ? (history[ni] ?? '') : '';
              setCmd(next);
              return ni;
            });
          }
        }} className="flex-1 px-2 py-1 bg-black text-white border border-white/15 rounded" />
        <button disabled={busy} onClick={onRun} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10 disabled:opacity-50">Run</button>
        <button onClick={onClear} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Clear</button>
        <button onClick={onCopy} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Copy</button>
        <button onClick={onSaveOut} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Save</button>
      </div>
      <pre className="mt-2 flex-1 overflow-auto border border-white/10 rounded p-2 bg-black text-white">{out}</pre>
      {ptyId && (
        <div className="mt-2 flex gap-2">
          <input placeholder="send input" onKeyDown={(e) => { if (e.key === 'Enter') { const t = (e.target as HTMLInputElement).value + '\n'; (window as any).rainvibe?.runPtyInput?.(ptyId, t); (e.target as HTMLInputElement).value = ''; } }} className="flex-1 px-2 py-1 bg-black text-white border border-white/15 rounded" />
          <button onClick={() => { if (ptyId) { (window as any).rainvibe?.runPtyStop?.(ptyId); setPtyId(null); } }} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10">Stop</button>
        </div>
      )}
    </div>
  );
};

export default RunConsole;

