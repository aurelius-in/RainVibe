import React from 'react';
import { simulateRun } from '@rainvibe/runtime';

const RunConsole: React.FC = () => {
  const [cmd, setCmd] = React.useState('echo Hello RainVibe');
  const [out, setOut] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const onRun = async () => {
    setBusy(true);
    const res = await simulateRun(cmd);
    setOut((prev) => prev + (prev ? '\n' : '') + res.output);
    setBusy(false);
    try { (window as any).rainvibe?.appendAudit?.(JSON.stringify({ kind:'run', cmd, ts: Date.now(), bytes: res.output?.length || 0 })+'\n'); } catch {}
  };
  const onClear = () => setOut('');
  const onCopy = async () => { try { await navigator.clipboard.writeText(out); } catch {} };
  return (
    <div className="h-full flex flex-col text-xs">
      <div className="flex gap-2">
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} className="flex-1 px-2 py-1 bg-black text-white border border-white/15 rounded" />
        <button disabled={busy} onClick={onRun} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10 disabled:opacity-50">Run</button>
        <button onClick={onClear} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Clear</button>
        <button onClick={onCopy} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Copy</button>
      </div>
      <pre className="mt-2 flex-1 overflow-auto border border-white/10 rounded p-2 bg-black text-white">{out}</pre>
    </div>
  );
};

export default RunConsole;

