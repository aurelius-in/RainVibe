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
    apiKey: undefined,
    model: prefs.model,
    offlineOnly: prefs.offlineOnly,
  }));

  React.useEffect(() => {
    providerRef.current = createProvider({
      provider: prefs.provider,
      apiKey: undefined,
      model: prefs.model,
      offlineOnly: prefs.offlineOnly,
    });
  }, [prefs.provider, prefs.model, prefs.offlineOnly]);

  return {
    chat: async (messages: AiMessage[]) => {
      try {
        const meta = { provider: prefs.provider, model: prefs.model, modes, ts: Date.now(), kind: 'ai_chat', direction: 'request', chars: messages.reduce((n, m) => n + (m.content?.length || 0), 0) };
        (window as any).rainvibe?.appendAudit?.(JSON.stringify({ ...meta, messages: messages.map(m => ({ role: m.role, content: redactSecrets(m.content) })) })+'\n');
      } catch {}
      const reply = await providerRef.current.chat(messages);
      try {
        const meta = { provider: prefs.provider, model: prefs.model, modes, ts: Date.now(), kind: 'ai_chat', direction: 'response', chars: reply.length };
        (window as any).rainvibe?.appendAudit?.(JSON.stringify({ ...meta, content: redactSecrets(reply) })+'\n');
      } catch {}
      return reply;
    },
  };
}

