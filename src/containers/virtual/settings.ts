import { observable, reaction, runInAction } from 'mobx';
import type { PenStyle } from './drawing';

export const penColors = [
  { name: 'Black', value: '#000000' },
  { name: 'Blue', value: '#1d4ed8' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#15803d' },
];

// pen tips, in mm
export const penWidths = [0.3, 0.5, 0.7, 1, 1.5, 2];

// how many times faster than real time, Infinity for no motion at all
export const speeds = [1, 2, 5, 10, Infinity];

export const speedLabel = (speed: number) =>
  speed === Infinity ? 'Instant' : `${speed}×`;

export type Settings = {
  pen: PenStyle;
  speed: number;
  sound: boolean;
};

const STORAGE_KEY = 'axidraw-web-virtual-plotter';

const defaults: Settings = {
  pen: { color: penColors[0].value, width: 0.7 },
  speed: 1,
  sound: true,
};

const isColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

const read = (): Settings => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}',
    ) as Partial<Record<keyof Settings, unknown>> & {
      pen?: Partial<Record<keyof PenStyle, unknown>>;
    };
    // JSON has no Infinity
    const speed = saved.speed === 'instant' ? Infinity : saved.speed;
    return {
      pen: {
        color: isColor(saved.pen?.color) ? saved.pen.color : defaults.pen.color,
        width:
          typeof saved.pen?.width === 'number' &&
          penWidths.includes(saved.pen.width)
            ? saved.pen.width
            : defaults.pen.width,
      },
      speed:
        typeof speed === 'number' && speeds.includes(speed)
          ? speed
          : defaults.speed,
      sound: typeof saved.sound === 'boolean' ? saved.sound : defaults.sound,
    };
  } catch {
    return defaults;
  }
};

// the settings of the virtual plotter window, kept for the next time
export const createSettings = () => {
  const settings = observable(read());
  const disposer = reaction(
    () =>
      JSON.stringify({
        ...settings,
        speed: settings.speed === Infinity ? 'instant' : settings.speed,
      }),
    (json) => {
      try {
        localStorage.setItem(STORAGE_KEY, json);
      } catch {
        // storage may be full or turned off, the settings still apply
      }
    },
  );
  return {
    get pen(): PenStyle {
      return settings.pen;
    },
    get speed() {
      return settings.speed;
    },
    get sound() {
      return settings.sound;
    },
    setPenColor(color: string) {
      runInAction(() => {
        settings.pen.color = color;
      });
    },
    setPenWidth(width: number) {
      runInAction(() => {
        settings.pen.width = width;
      });
    },
    setSpeed(speed: number) {
      runInAction(() => {
        settings.speed = speed;
      });
    },
    setSound(sound: boolean) {
      runInAction(() => {
        settings.sound = sound;
      });
    },
    dispose: disposer,
  };
};

export type VirtualSettings = ReturnType<typeof createSettings>;
