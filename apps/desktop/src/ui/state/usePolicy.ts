import React from 'react';
import type { PolicyStatus } from '@rainvibe/policy';

const KEY = 'rainvibe.policy.enabled';

export function usePolicy() {
  const [enabled, setEnabled] = React.useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'false'); } catch { return false; }
  });
  const [files, setFiles] = React.useState<string[]>([]);
  React.useEffect(() => {
    try { setFiles((window as any).rainvibe?.policyFiles?.() ?? []); } catch {}
  }, []);
  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(enabled)); } catch {}
  }, [enabled]);
  const status: PolicyStatus = { enabled, ruleFiles: files };
  return { status, toggle: () => setEnabled(v => !v) };
}

