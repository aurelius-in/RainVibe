import React from 'react';

interface Props { open: boolean; title?: string; diffText: string; onClose: () => void }

const UnifiedDiffModal: React.FC<Props> = ({ open, title, diffText, onClose }) => {
  if (!open) return null;
  const lines = (diffText || '').split(/\r?\n/);
  const hunks = React.useMemo(() => {
    const idx: number[] = [];
    lines.forEach((ln, i) => { if (ln.startsWith('@@')) idx.push(i); });
    return idx;
  }, [diffText]);
  const [hunkIdx, setHunkIdx] = React.useState(0);
  const goto = (dir: -1 | 1) => {
    if (!hunks.length) return;
    setHunkIdx((i) => (i + dir + hunks.length) % hunks.length);
    try {
      const target = document.querySelector(`[data-diff-line="${hunks[(hunkIdx + dir + hunks.length) % hunks.length]}"]`);
      target?.scrollIntoView({ block: 'center' });
    } catch {}
  };
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="w-[80vw] h-[70vh] bg-black border border-white/15 rounded overflow-hidden flex flex-col text-xs">
        <div className="px-3 h-9 flex items-center justify-between border-b border-white/10 text-sm">
          <span className="opacity-80">{title || 'Unified Diff'}</span>
          <div className="flex gap-2">
            <span className="opacity-70 text-xs hidden sm:inline">{hunks.length ? `Hunk ${hunkIdx+1}/${hunks.length}` : 'No hunks'}</span>
            <button onClick={() => goto(-1)} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Prev</button>
            <button onClick={() => goto(1)} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Next</button>
            <button onClick={() => { try { navigator.clipboard.writeText(diffText); } catch {} }} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Copy</button>
            <button onClick={onClose} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Close</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto font-mono">
          <pre className="p-3 leading-5">
{lines.map((ln, i) => {
  let cls = '';
  if (ln.startsWith('@@')) cls = 'text-blue-300';
  else if (ln.startsWith('+') && !ln.startsWith('+++')) cls = 'text-green-300';
  else if (ln.startsWith('-') && !ln.startsWith('---')) cls = 'text-red-300';
  else if (ln.startsWith('diff') || ln.startsWith('index') || ln.startsWith('---') || ln.startsWith('+++')) cls = 'text-purple-300';
  return (
    <div key={i} className={cls} data-diff-line={ln.startsWith('@@') ? i : undefined}>{ln || '\u00A0'}</div>
  );
})}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDiffModal;


