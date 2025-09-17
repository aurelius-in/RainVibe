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
  React.useEffect(() => {
    if (!open) setQ('');
  }, [open]);
  if (!open) return null;
  const filtered = commands.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-24">
      <div className="w-[640px] bg-black border border-white/15 rounded shadow-xl">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type an action..." className="w-full px-3 py-2 bg-black text-white outline-none border-b border-white/10" />
        <div className="max-h-80 overflow-auto">
          {filtered.map(c => (
            <button key={c.id} onClick={() => { c.run(); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-white/10">
              {c.title}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-6 text-sm text-white/60">No actions match.</div>}
        </div>
      </div>
    </div>
  );
};

export default ActionBoard;

