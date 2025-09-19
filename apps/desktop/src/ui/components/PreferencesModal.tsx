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
          <div className="border border-white/10 rounded p-2">
            <div className="opacity-70 text-xs mb-1">Profiles</div>
            <div className="flex items-center gap-2 mb-2">
              <select className="bg-black border border-white/15 rounded px-2 py-1" value={(local as any).activeProfile || ''} onChange={(e) => setLocal({ ...local, activeProfile: e.target.value } as any)}>
                <option value="">(none)</option>
                {Object.keys((local as any).profiles || {}).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <button className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs" onClick={() => {
                const name = prompt('New profile name');
                if (!name) return;
                const profiles = { ...((local as any).profiles || {}), [name]: { provider: local.provider, model: local.model, baseUrl: (local as any).baseUrl } };
                setLocal({ ...local, profiles, activeProfile: name } as any);
              }}>New</button>
              <button className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs" onClick={() => {
                const cur = (local as any).activeProfile || '';
                if (!cur) return;
                const profiles = { ...((local as any).profiles || {}) };
                delete profiles[cur];
                setLocal({ ...local, profiles, activeProfile: '' } as any);
              }}>Delete</button>
              <button className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs" onClick={() => {
                const cur = (local as any).activeProfile || '';
                if (!cur) return;
                const profiles = { ...((local as any).profiles || {}), [cur]: { provider: local.provider, model: local.model, baseUrl: (local as any).baseUrl } };
                setLocal({ ...local, profiles } as any);
              }}>Save Profile</button>
              <button className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10 text-xs" onClick={() => {
                const cur = (local as any).activeProfile || '';
                if (!cur) return;
                const p = ((local as any).profiles || {})[cur] || {};
                setLocal({ ...local, ...p } as any);
              }}>Load Profile</button>
            </div>
          </div>
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
          <div className="grid grid-cols-2 gap-2">
            <label className="block">Rate limit/min
              <input type="number" min={0} max={10000} className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={(local as any).rateLimitPerMin ?? 60} onChange={(e) => setLocal({ ...local, rateLimitPerMin: Number(e.target.value) || 0 } as any)} />
            </label>
            <label className="block">Proxy URL
              <input className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={(local as any).proxyUrl || ''} onChange={(e) => setLocal({ ...local, proxyUrl: e.target.value } as any)} />
            </label>
          </div>
          <label className="block">API Key
            <input type="password" className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={(local as any).apiKey || ''} onChange={(e) => setLocal({ ...local, apiKey: e.target.value } as any)} />
          </label>
          <label className="block">Base URL (optional)
            <input className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={(local as any).baseUrl || ''} onChange={(e) => setLocal({ ...local, baseUrl: e.target.value } as any)} />
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
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!local.lineNumbers} onChange={(e) => setLocal({ ...local, lineNumbers: e.target.checked })} />
            <span>Show line numbers</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!local.renderWhitespace} onChange={(e) => setLocal({ ...local, renderWhitespace: e.target.checked })} />
            <span>Render whitespace</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!local.tokenMeter} onChange={(e) => setLocal({ ...local, tokenMeter: e.target.checked })} />
            <span>Show token meter</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!(local as any).autosave} onChange={(e) => setLocal({ ...local, autosave: e.target.checked } as any)} />
            <span>Autosave buffers</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!(local as any).formatOnSave} onChange={(e) => setLocal({ ...local, formatOnSave: e.target.checked } as any)} />
            <span>Format on save</span>
          </label>
          <label className="block">Wrap column
            <input type="number" min={20} max={200} className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={(local as any).wordWrapColumn ?? 80} onChange={(e) => setLocal({ ...local, wordWrapColumn: Number(e.target.value) || 80 } as any)} />
          </label>
          <label className="block">Multi-cursor modifier
            <select className="mt-1 bg-black border border-white/15 rounded px-2 py-1 w-full" value={(local as any).multiCursorModifier ?? 'alt'} onChange={(e) => setLocal({ ...local, multiCursorModifier: e.target.value } as any)}>
              <option value="alt">Alt</option>
              <option value="ctrlCmd">Ctrl/Cmd</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!(local as any).columnSelection} onChange={(e) => setLocal({ ...local, columnSelection: e.target.checked } as any)} />
            <span>Enable column selection</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Cancel</button>
          <button onClick={() => { save(local); onClose(); }} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Save</button>
        </div>
        <div className="mt-3 text-xs opacity-70">Export/Import</div>
        <div className="mt-1 flex gap-2">
          <button onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(local, null, 2)); } catch {} }} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10 text-xs">Copy JSON</button>
          <button onClick={() => { const raw = prompt('Paste preferences JSON'); if (!raw) return; try { const obj = JSON.parse(raw); save({ ...local, ...obj }); } catch {} }} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10 text-xs">Paste JSON</button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;

