import type { AuditEvent } from './index';

export function exportJSONL(events: AuditEvent[]): string {
  return events.map(e => JSON.stringify(e)).join('\n');
}

export function exportHTML(events: AuditEvent[]): string {
  const rows = events.map(e => `<tr><td>${e.id}</td><td>${new Date(e.ts).toISOString()}</td><td>${e.kind}</td></tr>`).join('');
  return `<!doctype html><meta charset="utf-8"/><title>RainVibe Audit</title><body style="background:#000;color:#fff;font-family:Consolas,monospace"><h1>Audit Export</h1><table border="1" cellpadding="6" cellspacing="0">${rows}</table></body>`;
}

export function exportPDF(events: AuditEvent[]): Uint8Array {
  // Stub: a minimal placeholder. Integrate real PDF later.
  const text = `RainVibe Audit PDF (stub)\nCount: ${events.length}`;
  return new TextEncoder().encode(text);
}

