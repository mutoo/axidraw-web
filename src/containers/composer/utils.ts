import Logger from 'js-logger';
import { trackCategoryEvent } from '@/analystic';
import { createRandom } from '@/utils/random';

export const trackEvent = trackCategoryEvent('composer');

export const logger = Logger.get('composer');

export const DEFAULT_BPM = 88;
export const MIN_BPM = 10;
export const MAX_BPM = 200;

export type RawSong = {
  title: string;
  channel1: string[];
  channel2: string[];
  // the tempo the song is meant for, DEFAULT_BPM when not given
  bpm?: number;
};

export const createSong = (
  title: string,
  channel1: string[],
  channel2: string[],
  bpm?: number,
): RawSong => ({
  title,
  channel1,
  channel2,
  bpm,
});

export const flat = <T>(arr: T[][]) => arr.flatMap((i) => i);

// goes between the bars of a channel's notes
export const BAR_LINE = '|';

/**
 * Joins bars of notes into a channel, with a bar line between each.
 */
export const bars = (groups: string[][]) =>
  groups.flatMap((group, i) => (i === 0 ? group : [BAR_LINE, ...group]));

/**
 * Writes out a channel's notes, with its bar lines between the bars.
 */
export const formatChannel = (notes: string[]) => {
  const groups: string[][] = [[]];
  for (const note of notes) {
    if (note === BAR_LINE) {
      groups.push([]);
    } else {
      groups[groups.length - 1].push(note);
    }
  }
  return groups.map((group) => group.join(', ')).join(' | ');
};

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
  't' as const,
];

export type Beat = (typeof beats)[number];

export const beatsMap: Record<Beat, number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
  t: 0.125,
};

export type NoteWithBeats = {
  note: string;
  beats: number;
  frequency: number;
};

export const parseNote = (note: string): NoteWithBeats => {
  const parsed = note.match(/^([whqest]+)([0DA]|[CFG]#?|[EB]b?)(\d)?$/);
  if (!parsed) throw new Error(`Can not parse note: ${note}`);

  const [_, beatsSymbol, nodeName, nodeLevel] = parsed;
  // only a rest can go without an octave
  if (nodeName !== '0' && !nodeLevel) {
    throw new Error(`Note has no octave: ${note}`);
  }
  const beats = beatsSymbol
    .split('')
    .reduce((sum, d) => sum + beatsMap[d as Beat], 0);
  return {
    note,
    beats,
    frequency: noteToPitch(nodeName as Note, parseInt(nodeLevel, 10)),
  };
};

/**
 * Splits a channel's text into its notes and bar lines.
 */
export const tokenizeChannel = (text: string) =>
  text.split(/[\s,]+|(\|)/).filter(Boolean);

const parseChannel = (text: string) => {
  const notes: NoteWithBeats[] = [];
  // where the bar lines fall, in beats from the start
  const barlines: number[] = [];
  let beats = 0;
  for (const token of tokenizeChannel(text)) {
    if (token === BAR_LINE) {
      barlines.push(beats);
    } else {
      const note = parseNote(token);
      notes.push(note);
      beats += note.beats;
    }
  }
  return { notes, barlines };
};

export const parseSong = (channel1: string, channel2: string): Song => {
  const first = parseChannel(channel1);
  const second = parseChannel(channel2);
  return {
    channel1: first.notes,
    channel2: second.notes,
    barlines: [...new Set([...first.barlines, ...second.barlines])].sort(
      (a, b) => a - b,
    ),
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
  // the pitch each channel plays, 0 for a rest
  frequency1: number;
  frequency2: number;
  // whether a bar starts with this step
  barline: boolean;
};

export type Song = {
  channel1: NoteWithBeats[];
  channel2: NoteWithBeats[];
  // where either channel has a bar line, in beats from the start
  barlines?: number[];
};

/**
 * Generate steps from song.
 */
export function songToSteps(song: Song, beatPerMinute: number): Step[] {
  const secondPerBeat = 60 / beatPerMinute;
  const mixChannel = composeSong(song);
  // when each step starts, in beats
  const starts: number[] = [];
  mixChannel.reduce((start, { beats }) => {
    starts.push(start);
    return start + beats;
  }, 0);
  const startsBar = (start: number) =>
    song.barlines?.some((at) => Math.abs(at - start) < 1e-9) ?? false;
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
    return {
      duration,
      step1,
      step2,
      continue1,
      continue2,
      frequency1: freq1,
      frequency2: freq2,
      barline: startsBar(starts[idx]),
    };
  });
}

export type PlannedStep = {
  step1: number;
  step2: number;
  duration: number;
};

// How far each motor may go from where the song starts, in steps.
export type Limits = {
  a1: [number, number];
  a2: [number, number];
};

export type PlanOptions = {
  limits?: Limits;
  // how likely a channel carries on at a new note instead of turning around
  randomness?: number;
  // how likely the channels trade motors at a bar line
  swapChance?: number;
  // picks the random choices, so that a seed always plans the same path
  seed?: number;
};

export type Plan = {
  moves: PlannedStep[];
  // how many times a note turned back part-way to keep within the limits
  midNoteTurns: number;
  // how many times the channels traded motors
  swaps: number;
};

// mixed into the seed for the swaps, so they draw numbers of their own
const SWAP_SEED = 0x9e3779b9;

type Axis = {
  pos: number;
  dir: number;
  lo: number;
  hi: number;
  // the pitch of the note the axis played last
  frequency: number;
  midNoteTurns: number;
};

// An axis is at `pos` steps from the start `t` ms into a step.
type Waypoint = { t: number; pos: number };

/**
 * The steps left in the note each step belongs to, counting from that step.
 */
export const stepsToNoteEnd = (steps: Step[], channel: 1 | 2) => {
  const left = new Array<number>(steps.length);
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const { step1, step2 } = steps[i];
    const next = steps[i + 1] as Step | undefined;
    const continues = channel === 1 ? next?.continue1 : next?.continue2;
    left[i] = (channel === 1 ? step1 : step2) + (continues ? left[i + 1] : 0);
  }
  return left;
};

/**
 * Picks the direction of a new note. A repeated note always turns around, as
 * that is what sets it apart from the one before; any other note carries on
 * when `carryOn` says so. The whole note should fit within the limits, so it
 * goes the other way when only that way fits, or the roomier way when
 * neither does.
 */
const startNote = (
  axis: Axis,
  noteSteps: number,
  frequency: number,
  carryOn: boolean,
) => {
  const repeated = frequency > 0 && frequency === axis.frequency;
  const preferred = carryOn && !repeated ? axis.dir : -axis.dir;
  const room = (dir: number) =>
    dir > 0 ? axis.hi - axis.pos : axis.pos - axis.lo;
  if (room(preferred) >= noteSteps) {
    axis.dir = preferred;
  } else if (room(-preferred) >= noteSteps) {
    axis.dir = -preferred;
  } else {
    axis.dir = room(-preferred) > room(preferred) ? -preferred : preferred;
  }
  axis.frequency = frequency;
};

/**
 * Moves an axis `count` steps in `duration` ms, turning back at its limits.
 */
const moveAxis = (axis: Axis, count: number, duration: number) => {
  const waypoints: Waypoint[] = [{ t: 0, pos: axis.pos }];
  let left = count;
  while (left > 0 && axis.hi > axis.lo) {
    const room = axis.dir > 0 ? axis.hi - axis.pos : axis.pos - axis.lo;
    if (room <= 0) {
      axis.dir = -axis.dir;
      axis.midNoteTurns += 1;
      continue;
    }
    const run = Math.min(room, left);
    axis.pos += axis.dir * run;
    left -= run;
    waypoints.push({ t: (duration * (count - left)) / count, pos: axis.pos });
  }
  return waypoints;
};

const positionAt = (waypoints: Waypoint[], t: number) => {
  const next = waypoints.findIndex((waypoint) => waypoint.t >= t);
  if (next === -1) return waypoints[waypoints.length - 1].pos;
  if (next === 0) return waypoints[0].pos;
  const from = waypoints[next - 1];
  const to = waypoints[next];
  return from.pos + ((to.pos - from.pos) * (t - from.t)) / (to.t - from.t);
};

/**
 * Splits a step into moves wherever either axis turns around. The SM command
 * moves in a straight line, so each move stays between its two ends.
 */
const toMoves = (
  path1: Waypoint[],
  path2: Waypoint[],
  duration: number,
): PlannedStep[] => {
  const turns = [...path1, ...path2]
    .map(({ t }) => Math.round(t))
    .filter((t) => t > 0 && t < duration);
  const times = [...new Set(turns)].sort((a, b) => a - b);
  times.push(duration);
  // an axis that turns at `t` is right where it turns, so no steps get lost
  const at = (path: Waypoint[], t: number) =>
    path.filter((waypoint) => Math.round(waypoint.t) === t).at(-1)?.pos ??
    Math.round(positionAt(path, t));
  const moves: PlannedStep[] = [];
  let [t0, pos1, pos2] = [0, path1[0].pos, path2[0].pos];
  for (const t of times) {
    const next1 = at(path1, t);
    const next2 = at(path2, t);
    moves.push({ step1: next1 - pos1, step2: next2 - pos2, duration: t - t0 });
    [t0, pos1, pos2] = [t, next1, next2];
  }
  return moves;
};

/**
 * Picks the motor and the direction of every step. Each channel turns around
 * at a new note, or with `randomness`, may carry on instead. With
 * `swapChance`, the channels may trade motors at a bar line, which turns the
 * pen's strokes a quarter turn. With `limits`, a channel goes whichever way
 * keeps the note within them, and a note too long to fit either way turns
 * back at them.
 */
export const planSteps = (
  steps: Step[],
  { limits, randomness = 0, swapChance = 0, seed = 0 }: PlanOptions = {},
): Plan => {
  const random = createRandom(seed);
  // the swaps draw from their own numbers, so that turning them on or off
  // keeps every other random choice as it was
  const randomSwap = createRandom(seed ^ SWAP_SEED);
  const [axis1, axis2] = [limits?.a1, limits?.a2].map((range): Axis => ({
    pos: 0,
    dir: 1,
    lo: range?.[0] ?? -Infinity,
    hi: range?.[1] ?? Infinity,
    frequency: 0,
    midNoteTurns: 0,
  }));
  const noteEnds1 = stepsToNoteEnd(steps, 1);
  const noteEnds2 = stepsToNoteEnd(steps, 2);
  // a channel holding a note over a bar line can't change motor there
  const free = (continues: boolean, frequency: number) =>
    !continues || frequency === 0;
  let swapped = false;
  let swaps = 0;
  const moves = steps.flatMap((step, i) => {
    if (
      step.barline &&
      free(step.continue1, step.frequency1) &&
      free(step.continue2, step.frequency2) &&
      randomSwap() < swapChance
    ) {
      swapped = !swapped;
      swaps += 1;
    }
    // the motors that play channel 1 and channel 2
    const [forChannel1, forChannel2] = swapped
      ? [axis2, axis1]
      : [axis1, axis2];
    if (!step.continue1) {
      startNote(
        forChannel1,
        noteEnds1[i],
        step.frequency1,
        random() < randomness,
      );
    }
    if (!step.continue2) {
      startNote(
        forChannel2,
        noteEnds2[i],
        step.frequency2,
        random() < randomness,
      );
    }
    const path1 = moveAxis(forChannel1, step.step1, step.duration);
    const path2 = moveAxis(forChannel2, step.step2, step.duration);
    // moves are by motor
    return swapped
      ? toMoves(path2, path1, step.duration)
      : toMoves(path1, path2, step.duration);
  });
  return {
    moves,
    midNoteTurns: axis1.midNoteTurns + axis2.midNoteTurns,
    swaps,
  };
};
