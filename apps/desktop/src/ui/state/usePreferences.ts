import React from 'react';

export interface Preferences {
  provider: 'chatgpt' | 'anthropic' | 'azure' | 'local';
  model: string;
  offlineOnly: boolean;
}

const KEY = 'rainvibe.preferences';
const DEFAULTS: Preferences = { provider: 'chatgpt', model: 'gpt-4o-mini', offlineOnly: false };

export function usePreferences() {
  const [prefs, setPrefs] = React.useState<Preferences>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });
  const save = (next: Preferences) => {
    setPrefs(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };
  return { prefs, save };
}

