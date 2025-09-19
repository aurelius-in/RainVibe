// @ts-nocheck
import React from 'react';

export interface Preferences {
  provider: 'chatgpt' | 'anthropic' | 'azure' | 'local';
  model: string;
  offlineOnly: boolean;
  apiKey?: string;
  baseUrl?: string;
  ghostText?: boolean;
  telemetryOptIn?: boolean;
  minimap?: boolean;
  fontSize?: number;
  wordWrap?: boolean;
  tokenMeter?: boolean;
  lineNumbers?: boolean;
  renderWhitespace?: boolean;
  autosave?: boolean;
  formatOnSave?: boolean;
  wordWrapColumn?: number;
  formatOnSavePerLanguage?: Record<string, boolean>;
  multiCursorModifier?: 'alt' | 'ctrlCmd';
  columnSelection?: boolean;
  keybindings?: Record<string, string>; // normalized keystroke -> command id
  aliases?: Record<string, string>; // alias -> command id
  profiles?: Record<string, Partial<Preferences>>;
  activeProfile?: string;
  rateLimitPerMin?: number;
  proxyUrl?: string;
  nonStopIntervalSec?: number;
  nonStopAutoPush?: boolean;
  commitPolicy?: 'per_feature' | 'per_n_changes' | 'time_based' | 'manual';
  commitEveryNChanges?: number;
  commitTimeMinutes?: number;
  pushPolicy?: 'per_n_commits' | 'time_based' | 'manual';
  pushEveryNCommits?: number;
  pushTimeMinutes?: number;
  commitTemplate?: string;
}

const KEY = 'rainvibe.preferences';
const KEY_FIRST = 'rainvibe.firstRun';
const DEFAULTS: Preferences = { provider: 'chatgpt', model: 'gpt-4o-mini', offlineOnly: false, apiKey: '', baseUrl: '', ghostText: true, telemetryOptIn: false, minimap: true, fontSize: 14, wordWrap: false, wordWrapColumn: 80, tokenMeter: true, lineNumbers: true, renderWhitespace: false, autosave: false, formatOnSave: false, formatOnSavePerLanguage: { typescript: true, javascript: true, json: true, markdown: true }, multiCursorModifier: 'alt', columnSelection: true, keybindings: {}, aliases: {}, profiles: {}, activeProfile: '', rateLimitPerMin: 60, proxyUrl: '', nonStopIntervalSec: 45, nonStopAutoPush: true, commitPolicy: 'per_n_changes', commitEveryNChanges: 3, commitTimeMinutes: 30, pushPolicy: 'per_n_commits', pushEveryNCommits: 5, pushTimeMinutes: 30, commitTemplate: "{scope}: {summary}\n\n{details}" };

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
  // Autosave hook placeholder: consumers can watch prefs.autosave
  React.useEffect(() => {
    // no-op; reserved for future autosave timers
  }, [prefs.autosave]);
  const save = (next: Preferences) => {
    setPrefs(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };
  return { prefs, save };
}

