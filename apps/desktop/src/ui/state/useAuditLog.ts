import React from 'react';
import type { AuditEvent } from '@rainvibe/audit/src';

export function useAuditLog() {
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const record = (e: AuditEvent) => setEvents((prev) => [e, ...prev]);
  return { events, record };
}

