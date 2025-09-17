import React from 'react';

interface Props { open: boolean; onClose: () => void }

const ShortcutsModal: React.FC<Props> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="w-[560px] bg-black border border-white/15 rounded p-4 text-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold">Shortcuts</div>
          <button onClick={onClose} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Close</button>
        </div>
        <ul className="text-xs space-y-1">
          <li>Toggle Assistant Panel: Ctrl/Cmd + I</li>
          <li>Action Board: Ctrl/Cmd + K</li>
          <li>Apply patch preview: Ctrl/Cmd + Shift + Enter</li>
          <li>Save buffer: Ctrl/Cmd + S</li>
          <li>Switch Modes: Ctrl/Cmd + 1..5</li>
        </ul>
      </div>
    </div>
  );
};

export default ShortcutsModal;

