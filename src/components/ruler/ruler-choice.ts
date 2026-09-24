import { useSyncExternalStore } from 'react';

export type RulerVariant = 'clear' | 'wood' | 'steel' | 'yellow' | 'minimal';

export const RULER_OFF = 'off';

export type RulerChoice = RulerVariant | typeof RULER_OFF;

export const rulerVariants: { id: RulerVariant; name: string }[] = [
  { id: 'clear', name: 'Clear' },
  { id: 'wood', name: 'Wood' },
  { id: 'steel', name: 'Steel' },
  { id: 'yellow', name: 'Yellow' },
  { id: 'minimal', name: 'Minimal' },
];

const DEFAULT_CHOICE: RulerChoice = 'clear';

// kept for every window of the app, so they all show the same ruler
const STORAGE_KEY = 'axidraw-web-ruler';

const isChoice = (value: unknown): value is RulerChoice =>
  value === RULER_OFF || rulerVariants.some(({ id }) => id === value);

const read = (): RulerChoice => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isChoice(saved) ? saved : DEFAULT_CHOICE;
  } catch {
    return DEFAULT_CHOICE;
  }
};

let current: RulerChoice | null = null;
const listeners = new Set<() => void>();

export const getRulerChoice = () => (current ??= read());

export const setRulerChoice = (choice: RulerChoice) => {
  current = choice;
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // storage may be full or turned off, the choice still applies here
  }
  listeners.forEach((listener) => {
    listener();
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // a choice made in another window of the app
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    current = read();
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
};

// the ruler to show along the page, or off
export const useRulerChoice = () =>
  [useSyncExternalStore(subscribe, getRulerChoice), setRulerChoice] as const;
