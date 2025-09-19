import React from 'react';
import { usePreferences } from '../state/usePreferences';
import { registry } from '../commands/registry';

interface Props { open: boolean; onClose: () => void }

const KeybindingsModal: React.FC<Props> = ({ open, onClose }) => {
  const { prefs, save } = usePreferences();
  const [bindings, setBindings] = React.useState<Record<string, string>>(() => ({ ...(prefs.keybindings || {}) }));
  const [aliases, setAliases] = React.useState<Record<string, string>>(() => ({ ...(prefs as any).aliases || {} }));
  const [keystroke, setKeystroke] = React.useState('');
  const [cmdId, setCmdId] = React.useState('');
  const [aliasKey, setAliasKey] = React.useState('');
  const [aliasCmd, setAliasCmd] = React.useState('');
  const commands = React.useMemo(() => registry.getAll(), []);
  if (!open) return null;
  const addBinding = () => {
    if (!keystroke || !cmdId) return;
    const next = { ...bindings, [keystroke.trim().toLowerCase()]: cmdId };
    setBindings(next);
    try { save({ ...prefs, keybindings: next }); } catch {}
    setKeystroke(''); setCmdId('');
  };
  const removeBinding = (key: string) => {
    const next = { ...bindings }; delete next[key]; setBindings(next);
    try { save({ ...prefs, keybindings: next }); } catch {}
  };
  const addAlias = () => {
    if (!aliasKey || !aliasCmd) return;
    const next = { ...aliases, [aliasKey.trim()]: aliasCmd };
    setAliases(next);
    try { save({ ...prefs, aliases: next } as any); } catch {}
    setAliasKey(''); setAliasCmd('');
  };
  const removeAlias = (a: string) => {
    const next = { ...aliases }; delete next[a]; setAliases(next);
    try { save({ ...prefs, aliases: next } as any); } catch {}
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="w-[720px] bg-black border border-white/15 rounded p-4 text-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold">Keybindings & Aliases</div>
          <button onClick={onClose} className="px-2 py-0.5 border border-white/15 rounded hover:bg-white/10">Close</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="opacity-70 text-xs mb-2">Add Keybinding</div>
            <div className="flex gap-2 mb-2">
              <input value={keystroke} onChange={(e) => setKeystroke(e.target.value)} placeholder="e.g., mod+shift+p" className="px-2 py-1 bg-black text-white border border-white/15 rounded text-xs flex-1" />
              <select value={cmdId} onChange={(e) => setCmdId(e.target.value)} className="px-2 py-1 bg-black text-white border border-white/15 rounded text-xs flex-1">
                <option value="">Select command…</option>
                {commands.map(c => <option key={c.id} value={c.id}>{c.title} ({c.id})</option>)}
              </select>
              <button onClick={addBinding} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10 text-xs">Add</button>
            </div>
            <div className="opacity-70 text-xs mb-1">Current Bindings</div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {Object.entries(bindings).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border border-white/10 rounded px-2 py-1 text-xs">
                  <span>{k} → {v}</span>
                  <button onClick={() => removeBinding(k)} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Remove</button>
                </div>
              ))}
              {Object.keys(bindings).length === 0 && <div className="opacity-60 text-xs">No bindings</div>}
            </div>
          </div>
          <div>
            <div className="opacity-70 text-xs mb-2">Add Alias</div>
            <div className="flex gap-2 mb-2">
              <input value={aliasKey} onChange={(e) => setAliasKey(e.target.value)} placeholder="alias name" className="px-2 py-1 bg-black text-white border border-white/15 rounded text-xs flex-1" />
              <select value={aliasCmd} onChange={(e) => setAliasCmd(e.target.value)} className="px-2 py-1 bg-black text-white border border-white/15 rounded text-xs flex-1">
                <option value="">Select command…</option>
                {commands.map(c => <option key={c.id} value={c.id}>{c.title} ({c.id})</option>)}
              </select>
              <button onClick={addAlias} className="px-2 py-1 border border-white/15 rounded hover:bg-white/10 text-xs">Add</button>
            </div>
            <div className="opacity-70 text-xs mb-1">Current Aliases</div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {Object.entries(aliases).map(([a, id]) => (
                <div key={a} className="flex items-center justify-between border border-white/10 rounded px-2 py-1 text-xs">
                  <span>{a} → {id}</span>
                  <button onClick={() => removeAlias(a)} className="px-1 py-0.5 border border-white/15 rounded hover:bg-white/10">Remove</button>
                </div>
              ))}
              {Object.keys(aliases).length === 0 && <div className="opacity-60 text-xs">No aliases</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeybindingsModal;


