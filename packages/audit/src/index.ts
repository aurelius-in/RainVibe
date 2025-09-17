export interface AuditEvent {
  id: string;
  ts: number;
  kind: string;
  meta?: Record<string, unknown>;
}

export function createAuditEvent(kind: string, meta?: Record<string, unknown>): AuditEvent {
  return { id: Math.random().toString(36).slice(2), ts: Date.now(), kind, meta };
}

