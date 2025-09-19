import { describe, it, expect } from 'vitest';
import { resolveConflictMarkers } from './resolveConflict';

const sample = [
  'line a',
  '<<<<<<< HEAD',
  'ours 1',
  'ours 2',
  '=======',
  'theirs 1',
  'theirs 2',
  '>>>>>>> feature',
  'line z',
].join('\n');

describe('resolveConflictMarkers', () => {
  it('keeps ours section when strategy is ours', () => {
    const out = resolveConflictMarkers(sample, 'ours');
    expect(out).toContain('ours 1');
    expect(out).toContain('ours 2');
    expect(out).not.toContain('theirs 1');
    expect(out).not.toContain('<<<<<<<');
    expect(out).not.toContain('=======');
    expect(out).not.toContain('>>>>>>>');
  });

  it('keeps theirs section when strategy is theirs', () => {
    const out = resolveConflictMarkers(sample, 'theirs');
    expect(out).toContain('theirs 1');
    expect(out).toContain('theirs 2');
    expect(out).not.toContain('ours 1');
  });
});


