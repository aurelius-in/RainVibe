import React from 'react';
import { useBuffers } from '../state/useBuffers';

const EditorTabs: React.FC = () => {
  const { buffers, activeId, setActiveId, close, isDirty } = useBuffers();
  return (
    <div className="h-8 flex items-center gap-1 px-2 border-b border-white/10 text-xs">
      {buffers.map(b => (
        <div key={b.id} onMouseDown={(e) => { if (e.button === 1 && b.id !== 'welcome') { e.preventDefault(); close(b.id); } }} onContextMenu={(e) => { e.preventDefault(); if (b.id !== 'welcome') close(b.id); }} className={`flex items-center gap-2 px-2 py-1 rounded border ${activeId===b.id ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/10'}`}>
          <button onClick={() => setActiveId(b.id)}>{b.path}{isDirty(b) ? ' *' : ''}</button>
          {b.id !== 'welcome' && <button onClick={() => close(b.id)} className="opacity-60 hover:opacity-100">✕</button>}
        </div>
      ))}
    </div>
  );
};

export default EditorTabs;

