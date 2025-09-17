import React from 'react';

interface Props { open: boolean; onClose: () => void; onOpenPreferences: () => void; }

const KEY = 'rainvibe.onboarded';

export function shouldShowFirstRun(): boolean {
  try { return localStorage.getItem(KEY) !== 'true'; } catch { return false; }
}

const FirstRunModal: React.FC<Props> = ({ open, onClose, onOpenPreferences }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="w-[560px] bg-black border border-white/15 rounded p-4 text-sm text-white">
        <div className="font-semibold mb-2">Welcome to RainVibe</div>
        <div className="text-xs opacity-80 mb-4">Dark-only, Monaco-based, with Modes. Set your provider or choose offline-only.</div>
        <div className="flex justify-end gap-2">
          <button onClick={() => { try { localStorage.setItem(KEY, 'true'); } catch {}; onOpenPreferences(); onClose(); }} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Open Preferences</button>
          <button onClick={() => { try { localStorage.setItem(KEY, 'true'); } catch {}; onClose(); }} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Start</button>
        </div>
      </div>
    </div>
  );
};

export default FirstRunModal;

