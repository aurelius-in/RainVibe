import React from 'react';

export function useModes() {
  const [active, setActive] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rainvibe.modes') || '[]'); } catch { return []; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('rainvibe.modes', JSON.stringify(active)); } catch {}
  }, [active]);
  const update = (next: string[]) => setActive(next);
  return { active, update };
}

import React from 'react';
import type { Mode } from '@rainvibe/common';

const STORAGE_KEY = 'rainvibe.modes.active';

function normalizeModes(next: Mode[]): Mode[] {
  if (next.includes('Basic')) return ['Basic'];
  const unique = Array.from(new Set(next));
  return unique.filter((m) => m !== 'Basic') as Mode[];
}

export function useModes() {
  const [active, setActive] = React.useState<Mode[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return ['Basic'];
      const parsed = JSON.parse(raw) as Mode[];
      return normalizeModes(parsed.length ? parsed : ['Basic']);
    } catch {
      return ['Basic'];
    }
  });

  const update = (modes: Mode[]) => {
    const normalized = normalizeModes(modes);
    setActive(normalized);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch {}
  };

  return { active, update };
}

