export const createSong = (title, channel1, channel2) => ({
  title,
  channel1,
  channel2,
});

export const flat = (arr) => arr.flatMap((i) => i);

export const notes = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'Bb',
  'B',
];

// convert note to frequency (A-440) using patch-space transform
// p = 69 + 12 * ln(f / 440) / ln(2)
// f = 55 * 2 ^ ((p - 33) / 12)
// where C4{level: 4, offset: 0} = 60;
export const noteToPitch = (note, level) => {
  const offset = notes.indexOf(note);
  if (offset === -1) return 0;
  const p = 60 + (level - 4) * 12 + offset;
  return 55 * 2 ** ((p - 33) / 12);
};

export const beatsMap = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
};

export const parseNote = (note) => {
  const parsed = note.match(/^([whqes]+)([0DA]|[CFG]#?|[EB]b?)(\d)?$/);
  if (!parsed) throw new Error(`Can not parse note: ${note}`);
  // eslint-disable-next-line no-unused-vars
  const [_, beatsSymbol, nodeName, nodeLevel] = parsed;
  const beats = beatsSymbol.split('').reduce((sum, d) => sum + beatsMap[d], 0);
  return { beats, frequency: noteToPitch(nodeName, parseInt(nodeLevel, 10)) };
};

export const beatsOrMax = (note) => note?.beats ?? Number.MAX_VALUE;
export const beatsOrMin = (note) => note?.beats ?? Number.MIN_VALUE;

/**
 * Compose a song into one mix channel.
 *
 * @param song
 */
export const composeSong = (song) => {
  // A song is composed by two channels,
  // each channels contains a branch of notes.
  const mixChannel = [];
  const context = {
    beats: 0,
    i: 0,
    j: 0,
  };
  const { channel1, channel2 } = song;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const note1 = channel1[context.i];
    const note2 = channel2[context.j];
    if (!note1 && !note2) {
      break;
    }
    const min = Math.min(beatsOrMax(note1), beatsOrMax(note2));
    const max = Math.max(beatsOrMin(note1), beatsOrMin(note2));
    if (max === min && !context.ii && !context.jj) {
      context.beats = min;
      mixChannel.push({ ...context });
      context.i += 1;
      context.j += 1;
    } else if (!note2) {
      context.j = null;
      if (context.ii) {
        context.beats = context.ii;
        context.ii = 0;
      } else {
        context.beats = note1.beats;
      }
      mixChannel.push({ ...context });
      context.i += 1;
    } else if (!note1) {
      context.i = null;
      if (context.jj) {
        context.beats = context.jj;
        context.jj = 0;
      } else {
        context.beats = note2.beats;
      }
      mixChannel.push({ ...context });
      context.j += 1;
    } else {
      // min !== max
      if (!context.ii) {
        context.ii = note1.beats - min;
      } else {
        context.ii -= min;
      }
      if (!context.jj) {
        context.jj = note2.beats - min;
      } else {
        context.jj -= min;
      }
      context.beats = min;
      mixChannel.push({ ...context });
      if (context.ii === 0) {
        context.i += 1;
      }
      if (context.jj === 0) {
        context.j += 1;
      }
    }
  }
  return mixChannel;
};

/**
 * Generate steps from song.
 *
 *
 *
 * @param song
 * @param beatPerMinute
 * @returns {{duration: number, step1: number, step2: number, continue1: boolean, continue2: boolean}[]}
 */
export function songToSteps(song, beatPerMinute) {
  const secondPerBeat = 60 / beatPerMinute;
  const mixChannel = composeSong(song);
  return mixChannel.map((note, idx) => {
    const { beats, i, j } = note;
    const { frequency: freq1 } = song.channel1[i] || { frequency: 0 };
    const dist1 = freq1 * secondPerBeat;
    const step1 = (dist1 * beats) | 0;
    const { frequency: freq2 } = song.channel2[j] || { frequency: 0 };
    const dist2 = freq2 * secondPerBeat;
    const step2 = (dist2 * beats) | 0;
    const duration = (secondPerBeat * 1000 * beats) | 0;
    const prevNote = mixChannel[idx - 1];
    const continue1 = prevNote?.i === i;
    const continue2 = prevNote?.j === j;
    return { duration, step1, step2, continue1, continue2 };
  });
}

export const planSteps = (steps) => {
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
