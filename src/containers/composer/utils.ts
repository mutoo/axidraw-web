import Logger from 'js-logger';
import { trackCategoryEvent } from '@/analystic';

export const trackEvent = trackCategoryEvent('composer');

export const logger = Logger.get('composer');

export type RawSong = {
  title: string;
  channel1: string[];
  channel2: string[];
};

export const createSong = (
  title: string,
  channel1: string[],
  channel2: string[],
): RawSong => ({
  title,
  channel1,
  channel2,
});

export const flat = <T>(arr: T[][]) => arr.flatMap((i) => i);

export const notes = [
  'C' as const,
  'C#' as const,
  'D' as const,
  'Eb' as const,
  'E' as const,
  'F' as const,
  'F#' as const,
  'G' as const,
  'G#' as const,
  'A' as const,
  'Bb' as const,
  'B' as const,
];

export type Note = (typeof notes)[number];

// convert note to frequency (A-440) using patch-space transform
// p = 69 + 12 * ln(f / 440) / ln(2)
// f = 55 * 2 ^ ((p - 33) / 12)
// where C4{level: 4, offset: 0} = 60;
export const noteToPitch = (note: Note, level: number) => {
  const offset = notes.indexOf(note);
  if (offset === -1) return 0;
  const p = 60 + (level - 4) * 12 + offset;
  return 55 * 2 ** ((p - 33) / 12);
};

export const beats = [
  'w' as const,
  'h' as const,
  'q' as const,
  'e' as const,
  's' as const,
];

export type Beat = (typeof beats)[number];

export const beatsMap: Record<Beat, number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
};

export type NoteWithBeats = {
  note: string;
  beats: number;
  frequency: number;
};

export const parseNote = (note: string): NoteWithBeats => {
  const parsed = note.match(/^([whqes]+)([0DA]|[CFG]#?|[EB]b?)(\d)?$/);
  if (!parsed) throw new Error(`Can not parse note: ${note}`);

  const [_, beatsSymbol, nodeName, nodeLevel] = parsed;
  const beats = beatsSymbol
    .split('')
    .reduce((sum, d) => sum + beatsMap[d as Beat], 0);
  return {
    note,
    beats,
    frequency: noteToPitch(nodeName as Note, parseInt(nodeLevel, 10)),
  };
};

export const beatsOrMax = (note: NoteWithBeats | undefined) =>
  note?.beats ?? Number.MAX_VALUE;

export const beatsOrMin = (note: NoteWithBeats | undefined) =>
  note?.beats ?? Number.MIN_VALUE;

export type StepContext = {
  beats: number;
  i: number;
  iRemaining?: number;
  j: number;
  jRemaining?: number;
};

/**
 * Compose a song into one mix channel.
 */
export const composeSong = (song: Song): StepContext[] => {
  // A song is composed by two channels,
  // each channels contains a branch of notes.
  const mixChannel: StepContext[] = [];
  const context: StepContext = {
    beats: 0,
    i: 0,
    j: 0,
  };
  const { channel1, channel2 } = song;

  for (;;) {
    const note1: NoteWithBeats | undefined = channel1[context.i];
    const note2: NoteWithBeats | undefined = channel2[context.j];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!note1 && !note2) {
      // both channels are ended
      break;
    }

    const c1 = context.iRemaining ?? beatsOrMax(note1);
    const c2 = context.jRemaining ?? beatsOrMax(note2);
    const min = Math.min(c1, c2);
    const max = Math.max(c1, c2);
    if (max === min && !context.iRemaining && !context.jRemaining) {
      // two note are at the same duration
      context.beats = min;
      mixChannel.push({ ...context });
      // advance both channels
      context.i += 1;
      context.j += 1;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (!note2) {
      // channel 2 is ended
      context.j = -1;
      if (context.iRemaining) {
        context.beats = context.iRemaining;
        context.iRemaining = undefined;
      } else {
        context.beats = note1.beats;
      }
      mixChannel.push({ ...context });
      context.i += 1;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (!note1) {
      // channel 1 is ended
      context.i = -1;
      if (context.jRemaining) {
        context.beats = context.jRemaining;
        context.jRemaining = undefined;
      } else {
        context.beats = note2.beats;
      }
      mixChannel.push({ ...context });
      context.j += 1;
    } else {
      // min !== max or there is remaining beats
      if (!context.iRemaining) {
        context.iRemaining = note1.beats - min;
      } else {
        context.iRemaining -= min;
      }
      if (!context.jRemaining) {
        context.jRemaining = note2.beats - min;
      } else {
        context.jRemaining -= min;
      }
      context.beats = min;
      mixChannel.push({ ...context });
      // advance the channel if the note is ended
      if (context.iRemaining === 0) {
        context.i += 1;
        context.iRemaining = undefined;
      }
      if (context.jRemaining === 0) {
        context.j += 1;
        context.jRemaining = undefined;
      }
    }
  }
  return mixChannel;
};

export type Step = {
  step1: number;
  step2: number;
  duration: number;
  continue1: boolean;
  continue2: boolean;
};

export type Song = {
  channel1: NoteWithBeats[];
  channel2: NoteWithBeats[];
};

/**
 * Generate steps from song.
 */
export function songToSteps(song: Song, beatPerMinute: number): Step[] {
  const secondPerBeat = 60 / beatPerMinute;
  const mixChannel = composeSong(song);
  return mixChannel.map((note, idx) => {
    const { beats, i, j } = note;
    const { frequency: freq1 } = song.channel1[i] ?? { frequency: 0 };
    const dist1 = freq1 * secondPerBeat;
    const step1 = (dist1 * beats) | 0;
    const { frequency: freq2 } = song.channel2[j] ?? { frequency: 0 };
    const dist2 = freq2 * secondPerBeat;
    const step2 = (dist2 * beats) | 0;
    const duration = (secondPerBeat * 1000 * beats) | 0;
    const prevNote = mixChannel[idx - 1] as StepContext | undefined;
    const continue1 = prevNote?.i === i;
    const continue2 = prevNote?.j === j;
    return { duration, step1, step2, continue1, continue2 };
  });
}

export const planSteps = (steps: Step[]) => {
  let dir1 = 1;
  let dir2 = 1;
  return steps.map((step) => {
    const { step1, step2, duration } = step;
    if (!step.continue1) {
      dir1 *= -1;
    }
    if (!step.continue2) {
      dir2 *= -1;
    }
    return { step1: step1 * dir1, step2: step2 * dir2, duration };
  });
};
