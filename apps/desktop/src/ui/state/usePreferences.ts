import React from 'react';

export interface Preferences {
  provider: 'chatgpt' | 'anthropic' | 'azure' | 'local';
  model: string;
  offlineOnly: boolean;
  ghostText?: boolean;
  telemetryOptIn?: boolean;
  minimap?: boolean;
  fontSize?: number;
  wordWrap?: boolean;
  tokenMeter?: boolean;
  lineNumbers?: boolean;
  renderWhitespace?: boolean;
  autosave?: boolean;
}

const KEY = 'rainvibe.preferences';
const KEY_FIRST = 'rainvibe.firstRun';
const DEFAULTS: Preferences = { provider: 'chatgpt', model: 'gpt-4o-mini', offlineOnly: false, ghostText: true, telemetryOptIn: false, minimap: true, fontSize: 14, wordWrap: false, tokenMeter: true, lineNumbers: true, renderWhitespace: false, autosave: false };

export function usePreferences() {
  const [prefs, setPrefs] = React.useState<Preferences>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      let next = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
      const first = localStorage.getItem(KEY_FIRST) !== 'false';
      if (first) {
        const org = (window as any).rainvibe?.orgDefaults?.();
        if (org?.defaults) {
          next = { ...next, ...org.defaults } as Preferences;
        }
        localStorage.setItem(KEY_FIRST, 'false');
        localStorage.setItem(KEY, JSON.stringify(next));
      }
      return next;
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

