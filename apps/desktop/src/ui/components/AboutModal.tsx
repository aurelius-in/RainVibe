import React from 'react';

interface Props { open: boolean; onClose: () => void; }

const AboutModal: React.FC<Props> = ({ open, onClose }) => {
  const [md, setMd] = React.useState<string>('');
  React.useEffect(() => {
    if (!open) return;
    try { setMd(((window as any).rainvibe?.readReadme?.() as string) || ''); } catch { setMd(''); }
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="w-[720px] h-[70vh] bg-black border border-white/15 rounded p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-semibold">About RainVibe</div>
          <button onClick={onClose} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Close</button>
        </div>
        <pre className="whitespace-pre-wrap text-xs">{md}</pre>
      </div>
    </div>
  );
};

export default AboutModal;

