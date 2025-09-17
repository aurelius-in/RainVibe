import React from 'react';

type Mode = 'Basic' | 'Coach' | 'Bug Fixer' | 'Policy-Safe' | 'Compliance/Audit';

interface Props {
  active: Mode[];
  onChange: (modes: Mode[]) => void;
}

const all: Mode[] = ['Basic', 'Coach', 'Bug Fixer', 'Policy-Safe', 'Compliance/Audit'];

const ModeToggle: React.FC<Props> = ({ active, onChange }) => {
  const toggle = (m: Mode) => {
    if (m === 'Basic') return onChange(['Basic']);
    const withoutBasic = active.filter((x) => x !== 'Basic');
    const set = new Set(withoutBasic);
    if (set.has(m)) set.delete(m); else set.add(m);
    onChange([...set]);
  };
  return (
    <div className="flex gap-1">
      {all.map((m) => (
        <button
          key={m}
          onClick={() => toggle(m)}
          className={`px-2 py-0.5 border border-white/15 rounded ${active.includes(m) ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          {m}
        </button>
      ))}
    </div>
  );
};

export default ModeToggle;

