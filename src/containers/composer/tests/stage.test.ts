import { describe, expect, it } from 'vitest';
import { SM_MAX_MS_PER_STEP } from '@/communication/ebb/constants';
import { aaSteps2xyDist } from '@/math/ebb';
import * as songs from '../songs';
import {
  checkPadding,
  maxPadding,
  pageSizes,
  placeSong,
  travel,
} from '../stage';
import type { PlannedStep, Step } from '../utils';
import { DEFAULT_BPM, parseSong, planSteps, songToSteps } from '../utils';

// planSteps as it was before it learned about limits and randomness
const planStepsFreely = (steps: Step[]) => {
  let dir1 = 1;
  let dir2 = 1;
  return steps.map(({ step1, step2, duration, continue1, continue2 }) => {
    if (!continue1) dir1 *= -1;
    if (!continue2) dir2 *= -1;
    return { step1: step1 * dir1 || 0, step2: step2 * dir2 || 0, duration };
  });
};

const stepsOf = (channel1: string, channel2: string, bpm = DEFAULT_BPM) =>
  songToSteps(parseSong(channel1, channel2), bpm);

const stepsOfSong = (song: (typeof songs)[keyof typeof songs], bpm: number) =>
  stepsOf(song.channel1.join(' '), song.channel2.join(' '), bpm);

const expectValidSM = ({ step1, step2, duration }: PlannedStep) => {
  expect(Number.isInteger(duration) && duration >= 1).toBe(true);
  for (const steps of [step1, step2]) {
    expect(Number.isInteger(steps)).toBe(true);
    // the EBB steps an axis at most 25k times a second
    expect(Math.abs(steps)).toBeLessThanOrEqual(25 * duration);
    // and at least once every SM_MAX_MS_PER_STEP ms
    if (steps !== 0) {
      expect(duration).toBeLessThanOrEqual(
        Math.abs(steps) * SM_MAX_MS_PER_STEP,
      );
    }
  }
};

const firstSteps = (moves: PlannedStep[]) => moves.map(({ step1 }) => step1);

describe('planSteps', () => {
  it('turns each channel around at every new note', () => {
    for (const song of Object.values(songs)) {
      const steps = stepsOfSong(song, DEFAULT_BPM);
      expect(planSteps(steps).moves).toEqual(planStepsFreely(steps));
    }
  });

  it('keeps each motor within its limits', () => {
    const steps = stepsOf('qC5 qC5 hG5 wA5 qE5', 'wC3 wwG3');
    const limits = { a1: [-300, 250], a2: [-100, 100] } as const;
    const { moves } = planSteps(steps, {
      limits: { a1: [...limits.a1], a2: [...limits.a2] },
      randomness: 0.5,
      seed: 7,
    });
    let [a1, a2] = [0, 0];
    for (const move of moves) {
      a1 += move.step1;
      a2 += move.step2;
      expect(a1).toBeGreaterThanOrEqual(limits.a1[0]);
      expect(a1).toBeLessThanOrEqual(limits.a1[1]);
      expect(a2).toBeGreaterThanOrEqual(limits.a2[0]);
      expect(a2).toBeLessThanOrEqual(limits.a2[1]);
      expectValidSM(move);
    }
    // turning back never costs a note any steps or time
    const sum = (key: 'step1' | 'step2' | 'duration') =>
      steps.reduce((total, step) => total + step[key], 0);
    expect(moves.reduce((t, { duration }) => t + duration, 0)).toBe(
      sum('duration'),
    );
    const travelled = (key: 'step1' | 'step2') =>
      moves.reduce((total, move) => total + Math.abs(move[key]), 0);
    expect(travelled('step1')).toBe(sum('step1'));
    expect(travelled('step2')).toBe(sum('step2'));
  });

  it('carries on instead of turning only when the note would not fit', () => {
    // at 88 BPM a C5 quarter note is 356 steps and a G5 one 534
    const steps = stepsOf('qC5 qG5 qC5', '');
    const roomy = planSteps(steps, {
      limits: { a1: [-1000, 1000], a2: [0, 0] },
    });
    expect(firstSteps(roomy.moves)).toEqual([-356, 534, -356]);
    // turning for the G5 would pass 100, so it carries on down
    const cramped = planSteps(steps, {
      limits: { a1: [-1000, 100], a2: [0, 0] },
    });
    expect(firstSteps(cramped.moves)).toEqual([-356, -534, 356]);
    expect(cramped.midNoteTurns).toBe(0);
    // with no room below the start, the song starts upwards
    const repeated = stepsOf('qC5 qC5 qC5 qC5', '');
    const oneWay = planSteps(repeated, {
      limits: { a1: [0, 800], a2: [0, 0] },
    });
    expect(firstSteps(oneWay.moves)).toEqual([356, -356, 356, -356]);
  });

  it('turns a note back mid-way only when it is too long to fit', () => {
    // a whole C5 note is about 1430 steps, three times what the limits allow
    const steps = stepsOf('wC5', '');
    const { moves, midNoteTurns } = planSteps(steps, {
      limits: { a1: [-250, 250], a2: [0, 0] },
    });
    expect(midNoteTurns).toBeGreaterThan(0);
    expect(moves.length).toBeGreaterThan(1);
    expect(moves.reduce((t, { duration }) => t + duration, 0)).toBe(
      steps[0].duration,
    );
    moves.forEach(expectValidSM);
  });

  it('plans the same path for the same seed', () => {
    const steps = stepsOfSong(songs.odeToJoy, 100);
    const plan = (seed: number) =>
      planSteps(steps, { randomness: 0.5, seed }).moves;
    expect(plan(42)).toEqual(plan(42));
    expect(plan(43)).not.toEqual(plan(42));
  });

  it('always turns around for a repeated note', () => {
    const steps = stepsOf('qC5 qC5 qC5 qC5', '');
    for (const seed of [1, 2, 3]) {
      const signs = firstSteps(
        planSteps(steps, { randomness: 1, seed }).moves,
      ).map(Math.sign);
      expect(signs).toEqual([signs[0], -signs[0], signs[0], -signs[0]]);
    }
  });

  it('carries on between different notes as often as the randomness says', () => {
    const steps = stepsOf('qC5 qD5 qE5 qF5 qG5 qA5 qB5 qC6', '');
    const turns = (randomness: number) => {
      const signs = firstSteps(
        planSteps(steps, { randomness, seed: 5 }).moves,
      ).map(Math.sign);
      return signs.filter((sign, i) => i > 0 && sign !== signs[i - 1]).length;
    };
    expect(turns(0)).toBe(7);
    expect(turns(1)).toBe(0);
  });
});

describe('swapping channels', () => {
  // at 88 BPM a C5 quarter note is 356 steps and a C3 one 89
  const bars = stepsOf(
    'qC5 | qC5 | qC5 | qC5 | qC5 | qC5 | qC5 | qC5',
    'qC3 | qC3 | qC3 | qC3 | qC3 | qC3 | qC3 | qC3',
  );
  // which channel motor 1 plays at each step
  const motor1 = (moves: PlannedStep[]) =>
    moves.map(({ step1 }) => (Math.abs(step1) === 356 ? 'high' : 'low'));

  it('keeps each channel on its own motor without a chance to swap', () => {
    const { moves, swaps } = planSteps(bars, { seed: 1 });
    expect(swaps).toBe(0);
    expect(new Set(motor1(moves))).toEqual(new Set(['high']));
  });

  it('swaps at every bar line at a full chance', () => {
    const { moves, swaps } = planSteps(bars, { swapChance: 1, seed: 1 });
    expect(swaps).toBe(7);
    expect(motor1(moves)).toEqual([
      'high',
      'low',
      'high',
      'low',
      'high',
      'low',
      'high',
      'low',
    ]);
  });

  it('swaps at some bar lines, the same ones for the same seed', () => {
    const plan = (seed: number) => planSteps(bars, { swapChance: 0.5, seed });
    expect(plan(3)).toEqual(plan(3));
    const swaps = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => plan(seed).swaps);
    expect(Math.max(...swaps)).toBeLessThanOrEqual(7);
    expect(new Set(swaps).size).toBeGreaterThan(1);
  });

  it('never swaps while a note is held over the bar line', () => {
    // the low C is held through every bar line of the high one
    const held = stepsOf('qC5 | qC5 | qC5 | qC5', 'wC3');
    const { moves, swaps } = planSteps(held, { swapChance: 1, seed: 1 });
    expect(swaps).toBe(0);
    expect(new Set(motor1(moves))).toEqual(new Set(['high']));
  });

  it('reads bar lines with or without spaces around them', () => {
    const tight = stepsOf(
      'qC5|qC5|qC5|qC5|qC5|qC5|qC5|qC5',
      'qC3|qC3|qC3|qC3|qC3|qC3|qC3|qC3',
    );
    expect(tight).toEqual(bars);
  });
});

describe('placeSong', () => {
  const settings = {
    padding: 10,
    motorMode: 1,
    randomness: 0.3,
    seed: 1,
  };

  it.each(pageSizes)('starts in the middle of $alias', (page) => {
    for (const motorMode of [1, 2, 3, 4, 5]) {
      const steps = stepsOfSong(songs.twinkleTwinkleLittleStar, DEFAULT_BPM);
      const { start, path } = placeSong(steps, {
        ...settings,
        page,
        motorMode,
      });
      const { x, y } = aaSteps2xyDist(start, motorMode);
      // within a step, which is 0.2 mm at motor mode 5
      expect(Math.abs(x - page.width / 2)).toBeLessThan(0.25);
      expect(Math.abs(y - page.height / 2)).toBeLessThan(0.25);
      expect(path[0]).toMatchObject({ x, y, t: 0 });
    }
  });

  // the whole point: the pen must never run into the frame
  describe.each(pageSizes)('on $alias', (page) => {
    it.each(Object.entries(songs))(
      'keeps %s inside the padding',
      (id, song) => {
        for (const padding of [0, page.defaultPadding, 40])
          for (const motorMode of [1, 2, 3, 4, 5])
            for (const bpm of [song.bpm ?? DEFAULT_BPM, 30])
              for (const randomness of [0, 0.5])
                for (const swapChance of [0, 0.5])
                  for (const seed of [1, 2]) {
                    const context = `${id}, padding ${padding}, motor mode ${motorMode}, ${bpm} BPM, randomness ${randomness}, swap chance ${swapChance}, seed ${seed}`;
                    const steps = stepsOfSong(song, bpm);
                    const { moves, path } = placeSong(steps, {
                      page,
                      padding,
                      motorMode,
                      randomness,
                      swapChance,
                      seed,
                    });
                    // give or take the rounding to whole steps
                    const slack = 0.25;
                    for (const { x, y } of path) {
                      expect(x, context).toBeGreaterThanOrEqual(
                        padding - slack,
                      );
                      expect(x, context).toBeLessThanOrEqual(
                        page.width - padding + slack,
                      );
                      expect(y, context).toBeGreaterThanOrEqual(
                        padding - slack,
                      );
                      expect(y, context).toBeLessThanOrEqual(
                        page.height - padding + slack,
                      );
                    }
                    moves.forEach(expectValidSM);
                    expect(path.at(-1)?.t, context).toBe(
                      steps.reduce((t, { duration }) => t + duration, 0),
                    );
                  }
      },
    );
  });

  it('keeps even a very long note inside the padding', () => {
    // 16 beats of C6 at 10 BPM is about 100k full steps
    const steps = stepsOf('wwwwC6', 'wwwwC3', 10);
    const page = pageSizes[1];
    const { path, moves, midNoteTurns } = placeSong(steps, {
      ...settings,
      page,
      motorMode: 5,
    });
    expect(midNoteTurns).toBeGreaterThan(0);
    for (const { x, y } of path) {
      expect(x).toBeGreaterThanOrEqual(settings.padding - 0.25);
      expect(x).toBeLessThanOrEqual(page.width - settings.padding + 0.25);
      expect(y).toBeGreaterThanOrEqual(settings.padding - 0.25);
      expect(y).toBeLessThanOrEqual(page.height - settings.padding + 0.25);
    }
    moves.forEach(expectValidSM);
  });

  it('checks the padding leaves room to play', () => {
    const [a4] = pageSizes;
    expect(checkPadding(a4, 15)).toBeNull();
    expect(checkPadding(a4, 0)).toBeNull();
    expect(checkPadding(a4, maxPadding(a4))).toBeNull();
    expect(checkPadding(a4, maxPadding(a4) + 1)).not.toBeNull();
    expect(checkPadding(a4, -1)).not.toBeNull();
    expect(checkPadding(a4, NaN)).not.toBeNull();
  });
});

describe('travel', () => {
  it.each([
    [{ a1: 20000, a2: 3000 }, 1],
    [{ a1: -20000, a2: -3000 }, 1],
    [{ a1: 1200, a2: 200 }, 5],
    [{ a1: 15000, a2: 1 }, 1],
    [{ a1: -2, a2: 9000 }, 1],
    [{ a1: 1, a2: -1 }, 1],
  ])('goes %o in motor mode %i with moves the EBB takes', (delta, mode) => {
    const moves = travel(delta, mode);
    moves.forEach(expectValidSM);
    expect(moves.reduce((sum, { step1 }) => sum + step1, 0)).toBe(delta.a1);
    expect(moves.reduce((sum, { step2 }) => sum + step2, 0)).toBe(delta.a2);
  });

  it('stays put for no distance', () => {
    expect(travel({ a1: 0, a2: 0 }, 1)).toEqual([]);
  });
});
