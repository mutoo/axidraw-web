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

// convert note to frequency (A-440)
export const noteToPitch = (note, level) => {
  const offset = notes.indexOf(note);
  const base = 440 * 2 ** (level - 4);
  return base * (1 + (offset - 9) / 12);
};

export const durationMap = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
};

export const parseNote = (note) => {
  // eslint-disable-next-line no-unused-vars
  const [_, durations, nodeName, nodeLevel] = note.match(
    /^([whqes]+)([0DA]|[CFG]#?|[EB]b?)(\d)?$/,
  );
  const duration = durations
    .split('')
    .reduce((sum, d) => sum + durationMap[d], 0);
  return { duration, nodeName, nodeLevel: parseInt(nodeLevel, 10) };
};

export const durationOrMax = (note) => note?.duration ?? Number.MAX_VALUE;
export const durationOrMin = (note) => note?.duration ?? Number.MIN_VALUE;
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
    duration: 0,
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
    const min = Math.min(durationOrMax(note1), durationOrMax(note2));
    const max = Math.max(durationOrMin(note1), durationOrMin(note2));
    if (max === min && !context.ii && !context.jj) {
      context.duration = min;
      mixChannel.push({ ...context });
      context.i += 1;
      context.j += 1;
    } else if (!note2) {
      context.duration = note1.duration;
      mixChannel.push({ ...context });
      context.i += 1;
    } else if (!note1) {
      context.duration = note2.duration;
      mixChannel.push({ ...context });
      context.j += 1;
    } else {
      // min !== max
      if (!context.ii) {
        context.ii = note1.duration - min;
      } else {
        context.ii -= min;
      }
      if (!context.jj) {
        context.jj = note2.duration - min;
      } else {
        context.jj -= min;
      }
      context.duration = min;
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
 * @returns {Generator<{time: number, step2: number, step1: number}, void, *>}
 */
export function* songToSteps(song, beatPerMinute) {
  const secondPerBeat = 60 / beatPerMinute;
  const msPerBeat = ((60 / beatPerMinute) * 1000) | 0;
  let dir1 = 1;
  let dir2 = 1;
  let i = 0;
  let j = 0;
  while (song.channel1[i] || song.channel2[j]) {
    let beats;
    let beats1 = 1;
    let beats2 = 1;
    let p1 = 0;
    let p2 = 0;
    do {
      if (p1 >= beats1) {
        i += 1;
        p1 -= beats1;
        dir1 *= -1;
      }
      let dist1 = 0;
      const note1 = parseNote(song.channel1[i]);
      if (note1) {
        beats1 = durationMap[note1.duration];
        const frequency = noteToPitch(note1.nodeName, note1.nodeLevel);
        dist1 = Math.floor(frequency * secondPerBeat);
      }

      if (p2 >= beats2) {
        j += 1;
        p2 -= beats2;
        dir2 *= -1;
      }

      let dist2 = 0;
      const note2 = parseNote(song.channel2[i]);
      if (note2) {
        beats2 = durationMap[note2.duration];
        const frequency = noteToPitch(note2.nodeName, note2.nodeLevel);
        dist2 = Math.floor(frequency * secondPerBeat);
      }

      beats = Math.min(beats1, beats2);
      const step1 = (dist1 * dir1 * beats) | 0;
      const step2 = (dist2 * dir2 * beats) | 0;
      const time = msPerBeat * beats;
      // eslint-disable-next-line no-await-in-loop
      yield { time, step1, step2 };

      p1 += beats;
      p2 += beats;
    } while (p1 < beats1 || p2 < beats2);
    i += 1;
    dir1 *= -1;
    j += 1;
    dir2 *= -1;
  }
}
