export type ConflictStrategy = 'ours' | 'theirs';

// Pure resolver for unit tests; mirrors preload implementation
export function resolveConflictMarkers(input: string, strategy: ConflictStrategy): string {
  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  let inBlock = false;
  let collecting: ConflictStrategy | null = null;
  let ours: string[] = [];
  let theirs: string[] = [];
  for (const ln of lines) {
    if (ln.startsWith('<<<<<<<')) {
      inBlock = true;
      collecting = 'ours';
      ours = [];
      theirs = [];
      continue;
    }
    if (inBlock && ln.startsWith('=======')) {
      collecting = 'theirs';
      continue;
    }
    if (inBlock && ln.startsWith('>>>>>>>')) {
      const chosen = strategy === 'ours' ? ours : theirs;
      out.push(...chosen);
      inBlock = false;
      collecting = null;
      ours = [];
      theirs = [];
      continue;
    }
    if (inBlock) {
      if (collecting === 'ours') ours.push(ln);
      else if (collecting === 'theirs') theirs.push(ln);
    } else {
      out.push(ln);
    }
  }
  return out.join('\n');
}


