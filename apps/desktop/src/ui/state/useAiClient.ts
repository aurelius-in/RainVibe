import React from 'react';
import { createProvider } from '@rainvibe/ai';
import type { AiMessage } from '@rainvibe/ai/src/types';
import { usePreferences } from './usePreferences';

export function useAiClient() {
  const { prefs } = usePreferences();
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
    chat: (messages: AiMessage[]) => providerRef.current.chat(messages),
  };
}

