const patterns: Array<RegExp> = [
  /(?<=api[_-]?key[=:]\s*)[A-Za-z0-9_\-]{16,}/gi,
  /(?<=token[=:]\s*)[A-Za-z0-9_\-]{16,}/gi,
  /(?<=secret[=:]\s*)[A-Za-z0-9_\-]{12,}/gi,
  /(?<=AUTH|BEARER|Bearer\s+)[A-Za-z0-9_\-\.]+/g,
];

export function redactSecrets(input: string): string {
  let out = input;
  for (const re of patterns) {
    out = out.replace(re, '***REDACTED***');
  }
  // Redact .env style lines
  out = out.replace(/^(?:[A-Z0-9_]+)=(.+)$/gim, (_m, _v) => {
    return _m.replace(/=(.+)$/, '=***REDACTED***');
  });
  return out;
}

export function redactMeta(meta: unknown): unknown {
  if (typeof meta === 'string') return redactSecrets(meta);
  if (Array.isArray(meta)) return meta.map(redactMeta);
  if (meta && typeof meta === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
      result[k] = redactMeta(v);
    }
    return result;
  }
  return meta;
}

