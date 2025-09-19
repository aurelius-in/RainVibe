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

  it('no-op on input without markers', () => {
    const input = 'hello\nworld';
    const out = resolveConflictMarkers(input, 'ours');
    expect(out).toBe(input);
  });

  it('handles multiple conflict blocks', () => {
    const multi = [
      'a',
      '<<<<<<< HEAD',
      'x1',
      '=======',
      'y1',
      '>>>>>>> br',
      'b',
      '<<<<<<< HEAD',
      'x2',
      '=======',
      'y2',
      '>>>>>>> br',
      'c',
    ].join('\n');
    const out = resolveConflictMarkers(multi, 'theirs');
    expect(out).toContain('y1');
    expect(out).toContain('y2');
    expect(out).not.toContain('x1');
    expect(out).not.toContain('x2');
  });
});


