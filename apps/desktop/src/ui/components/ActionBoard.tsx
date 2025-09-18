import React from 'react';

interface Command {
  id: string;
  title: string;
  run: () => void;
}

interface Props {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}

const ActionBoard: React.FC<Props> = ({ open, commands, onClose }) => {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  React.useEffect(() => {
    if (!open) setQ('');
    if (open) setSel(0);
  }, [open]);
  if (!open) return null;
  const filtered = commands.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-24" onClick={onClose}>
      <div className="w-[640px] bg-black border border-white/15 rounded shadow-xl" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(i + 1, Math.max(0, filtered.length - 1))); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
            if (e.key === 'Enter') { e.preventDefault(); const cmd = filtered[sel]; if (cmd) { cmd.run(); onClose(); } }
            if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); const cmd = filtered[sel]; if (cmd) { cmd.run(); onClose(); } }
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
          }}
          placeholder="Type an action..."
          className="w-full px-3 py-2 bg-black text-white outline-none border-b border-white/10"
        />
        <div className="max-h-80 overflow-auto">
          {filtered.map((c, idx) => (
            <button
              key={c.id}
              onMouseEnter={() => setSel(idx)}
              onClick={() => { c.run(); onClose(); }}
              className={`w-full text-left px-3 py-2 ${sel===idx ? 'bg-white/15' : 'hover:bg-white/10'}`}
            >
              <div className="flex items-center justify-between">
                <span>{c.title}</span>
                <span className="opacity-50 text-[10px]">{c.id}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-6 text-sm text-white/60">No actions match.</div>}
        </div>
      </div>
    </div>
  );
};

export default ActionBoard;

