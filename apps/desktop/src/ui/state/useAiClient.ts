import React from 'react';
import { createProvider } from '@rainvibe/ai';
import type { AiMessage } from '@rainvibe/ai/src/types';
import { usePreferences } from './usePreferences';
import { redactSecrets } from '@rainvibe/common/src/redaction';
import { useModes } from './useModes';

export function useAiClient() {
  const { prefs } = usePreferences();
  const { active: modes } = useModes();
  const providerRef = React.useRef(createProvider({
    provider: prefs.provider,
    apiKey: prefs.apiKey,
    model: prefs.model,
    offlineOnly: prefs.offlineOnly,
    baseUrl: prefs.baseUrl,
  }));

  React.useEffect(() => {
    providerRef.current = createProvider({
      provider: prefs.provider,
      apiKey: prefs.apiKey,
      model: prefs.model,
      offlineOnly: prefs.offlineOnly,
      baseUrl: prefs.baseUrl,
    });
  }, [prefs.provider, prefs.model, prefs.offlineOnly, prefs.apiKey, prefs.baseUrl]);

  return {
    chat: async (messages: AiMessage[]) => {
      const systemHints: string[] = [];
      if (modes.includes('Policy-Safe')) systemHints.push('Follow organization safety policies and avoid disallowed content.');
      if (modes.includes('Compliance/Audit')) systemHints.push('Respond with traceable, auditable steps and cite file paths.');
      const base = systemHints.length ? ([{ role: 'system', content: systemHints.join(' ') } as AiMessage, ...messages]) : messages;
      const enriched = modes.includes('Policy-Safe')
        ? base.map(m => ({ ...m, content: typeof m.content === 'string' ? redactSecrets(m.content) : m.content }))
        : base;
      try {
        const meta = { provider: prefs.provider, model: prefs.model, modes, ts: Date.now(), kind: 'ai_chat', direction: 'request', chars: enriched.reduce((n, m) => n + (m.content?.length || 0), 0) };
        (window as any).rainvibe?.appendAudit?.(JSON.stringify({ ...meta, messages: enriched.map(m => ({ role: m.role, content: redactSecrets(m.content) })) })+'\n');
      } catch {}
      const reply = await providerRef.current.chat(enriched);
      try {
        const meta = { provider: prefs.provider, model: prefs.model, modes, ts: Date.now(), kind: 'ai_chat', direction: 'response', chars: reply.length };
        (window as any).rainvibe?.appendAudit?.(JSON.stringify({ ...meta, content: redactSecrets(reply) })+'\n');
      } catch {}
      return reply;
    },
    stream: (messages: AiMessage[]) => {
      const gen = providerRef.current.stream?.(messages);
      if (gen) return gen;
      return (async function* fallback() {
        const full = await providerRef.current.chat(messages);
        yield full;
      })();
    },
  };
}

