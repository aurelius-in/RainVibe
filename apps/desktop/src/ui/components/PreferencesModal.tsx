import React from 'react';
import { usePreferences } from '../state/usePreferences';

interface Props { open: boolean; onClose: () => void; }

const PreferencesModal: React.FC<Props> = ({ open, onClose }) => {
  const { prefs, save } = usePreferences();
  const [local, setLocal] = React.useState(prefs);
  React.useEffect(() => { setLocal(prefs); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="w-[560px] bg-black border border-white/15 rounded p-4 text-sm">
        <div className="text-white font-semibold mb-3">Preferences</div>
        <div className="space-y-3">
          <label className="block">Provider
            <select className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={local.provider} onChange={(e) => setLocal({ ...local, provider: e.target.value as any })}>
              <option value="chatgpt">ChatGPT</option>
              <option value="anthropic">Anthropic</option>
              <option value="azure">Azure OpenAI</option>
              <option value="local">Local</option>
            </select>
          </label>
          <label className="block">Model
            <input className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={local.model} onChange={(e) => setLocal({ ...local, model: e.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={local.offlineOnly} onChange={(e) => setLocal({ ...local, offlineOnly: e.target.checked })} />
            <span>Offline-only mode</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!local.ghostText} onChange={(e) => setLocal({ ...local, ghostText: e.target.checked })} />
            <span>Inline ghost text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!local.telemetryOptIn} onChange={(e) => setLocal({ ...local, telemetryOptIn: e.target.checked })} />
            <span>Opt-in telemetry</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!local.minimap} onChange={(e) => setLocal({ ...local, minimap: e.target.checked })} />
            <span>Editor minimap</span>
          </label>
          <label className="block">Font size
            <input type="number" min={10} max={28} className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={local.fontSize ?? 14} onChange={(e) => setLocal({ ...local, fontSize: Number(e.target.value) || 14 })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!local.wordWrap} onChange={(e) => setLocal({ ...local, wordWrap: e.target.checked })} />
            <span>Editor word wrap</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Cancel</button>
          <button onClick={() => { save(local); onClose(); }} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Save</button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;

