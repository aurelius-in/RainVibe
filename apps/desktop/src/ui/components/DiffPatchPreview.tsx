import React from 'react';
import { DiffEditor } from '@monaco-editor/react';

interface Props {
  open: boolean;
  original: string;
  modified: string;
  language: string;
  onApply: () => void;
  onClose: () => void;
}

const DiffPatchPreview: React.FC<Props> = ({ open, original, modified, language, onApply, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="w-[80vw] h-[70vh] bg-black border border-white/15 rounded overflow-hidden flex flex-col">
        <div className="px-3 h-9 flex items-center justify-between border-b border-white/10 text-sm">
          <span>Proposed changes</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Close</button>
            <button onClick={onApply} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Apply</button>
          </div>
        </div>
        <div className="flex-1">
          <DiffEditor theme="vs-dark" language={language} original={original} modified={modified} />
        </div>
      </div>
    </div>
  );
};

export default DiffPatchPreview;

