import React from 'react';

interface Props { open: boolean; text: string; onClose: () => void }

const BlameModal: React.FC<Props> = ({ open, text, onClose }) => {
  if (!open) return null;
  const lines = (text || '').split(/\r?\n/);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Git blame view">
      <div className="w-[80vw] h-[70vh] bg-black border border-white/15 rounded overflow-hidden flex flex-col text-xs">
        <div className="px-3 h-9 flex items-center justify-between border-b border-white/10 text-sm">
          <span className="opacity-80">Git Blame</span>
          <button onClick={onClose} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10" aria-label="Close blame">Close</button>
        </div>
        <div className="flex-1 overflow-auto font-mono p-2">
          {lines.map((ln, i) => (
            <div key={i} className="whitespace-pre">
              <span className="opacity-40 mr-2">{String(i+1).padStart(4,' ')}</span>
              {ln || '\u00A0'}
            </div>
          ))}
          {lines.length === 0 && <div className="opacity-60">No blame data</div>}
        </div>
      </div>
    </div>
  );
};

export default BlameModal;


