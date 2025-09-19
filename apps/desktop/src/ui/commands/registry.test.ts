import { describe, it, expect, vi } from 'vitest';
import { registry } from './registry';

describe('CommandRegistry', () => {
  it('registers and retrieves commands', () => {
    const fn = vi.fn();
    registry.register({ id: 'demo', title: 'Demo', run: fn });
    const got = registry.get('demo');
    expect(got).toBeTruthy();
    got?.run();
    expect(fn).toHaveBeenCalled();
    const all = registry.getAll();
    expect(all.find(c => c.id === 'demo')).toBeTruthy();
  });
});


