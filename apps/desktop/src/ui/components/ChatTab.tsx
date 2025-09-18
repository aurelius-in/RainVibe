import React from 'react';
import { useAiClient } from '../state/useAiClient';
import { usePreferences } from '../state/usePreferences';
import { useModes } from '../state/useModes';

interface Message { role: 'user' | 'assistant'; content: string }

const ChatTab: React.FC = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const { chat } = useAiClient();
  const { prefs } = usePreferences();
  const { active: modes } = useModes();

  const runSlash = async (text: string) => {
    if (text.startsWith('/plan')) return 'Planned: outline steps.';
    if (text.startsWith('/implement')) return 'Implementation steps drafted.';
    if (text.startsWith('/test')) return 'Test plan proposed.';
    if (text.startsWith('/explain')) return 'Explanation: terse overview provided.';
    if (text.startsWith('/hint')) return 'Hint: consider edge cases and constraints.';
    if (text.startsWith('/complexity')) return 'Complexity: roughly O(n log n) or similar.';
    return null;
  };

  const onSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setInput('');
    let slash = await runSlash(trimmed);
    if (!slash && modes.includes('Bug Fixer')) {
      slash = 'Bug Fixer: analyzing issue and proposing a minimal diff...';
    }
    if (!slash && modes.includes('Coach')) {
      slash = 'Coach: here are a few hints → options → solution.';
    }
    if (!slash && trimmed.startsWith('/mode ')) {
      const name = trimmed.split(/\s+/)[1];
      window.dispatchEvent(new CustomEvent('rainvibe:switch-mode', { detail: name }));
      slash = `Mode switched to ${name}`;
    }
    if (slash) {
      setMessages((m) => [...m, { role: 'assistant', content: slash }]);
      return;
    }
    const reply = await chat([{ role: 'user', content: trimmed } as any]);
    const hint = prefs.offlineOnly ? ' (offline)' : '';
    setMessages((m) => [...m, { role: 'assistant', content: reply + hint }]);
  };

  const insertLastReply = () => {
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    window.dispatchEvent(new CustomEvent('rainvibe:insert-text', { detail: last.content } as any));
  };

  const sendSelection = () => {
    const sel = localStorage.getItem('rainvibe.chat.selection') || '';
    if (sel) setInput(sel);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-2 text-xs">
        {messages.map((m, i) => (
          <div key={i} className={`px-2 py-1 rounded border border-white/10 ${m.role === 'assistant' ? 'bg-white/5' : ''}`}>
            <b className="opacity-70 mr-1">{m.role}:</b>
            <span>{m.content}</span>
          </div>
        ))}
        {messages.length === 0 && <div className="opacity-60">Type a message or try /plan, /implement, /test</div>}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }} className="flex-1 px-2 py-1 bg-black text-white border border-white/15 rounded" placeholder="Message" />
        <button onClick={onSend} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Send</button>
        <button onClick={insertLastReply} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Insert ↘︎</button>
        <button onClick={sendSelection} className="px-3 py-1 border border-white/15 rounded hover:bg-white/10">Use Selection</button>
      </div>
    </div>
  );
};

export default ChatTab;

