import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ruler choice', () => {
  let stored: Record<string, string>;

  beforeEach(() => {
    vi.resetModules();
    stored = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored[key] ?? null,
      setItem: (key: string, value: string) => {
        stored[key] = value;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the choice for every window of the app', async () => {
    const { getRulerChoice, setRulerChoice } = await import('../ruler-choice');
    setRulerChoice('steel');
    expect(stored['axidraw-web-ruler']).toBe('steel');
    expect(getRulerChoice()).toBe('steel');
  });

  it('starts with the one kept', async () => {
    stored['axidraw-web-ruler'] = 'off';
    const { getRulerChoice } = await import('../ruler-choice');
    expect(getRulerChoice()).toBe('off');
  });

  it('starts with a clear ruler when none or no known one is kept', async () => {
    stored['axidraw-web-ruler'] = 'nonsense';
    const { getRulerChoice } = await import('../ruler-choice');
    expect(getRulerChoice()).toBe('clear');
  });
});
