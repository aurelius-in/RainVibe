import React from 'react';

interface Item { line: number; text: string }

const OutlinePanel: React.FC<{ outline: Item[]; onGoTo?: (line: number) => void }> = ({ outline, onGoTo }) => {
  return (
    <div className="h-full flex flex-col text-xs">
      <div className="opacity-70 mb-2">Outline</div>
      <div className="space-y-1 overflow-auto">
        {outline.map((o, i) => (
          <button key={i} onClick={() => onGoTo?.(o.line)} className="w-full text-left px-2 py-1 border border-white/10 rounded hover:bg-white/10">
            <span className="opacity-60 mr-2">{o.line}</span>
            <span>{o.text}</span>
          </button>
        ))}
        {outline.length === 0 && <div className="opacity-60">No symbols</div>}
      </div>
    </div>
  );
};

export default OutlinePanel;


