import { SM_MAX_MS_PER_STEP } from '@/communication/ebb/constants';
import { aaSteps2xyDist, mm2steps, xyDist2aaSteps } from '@/math/ebb';
import type { PageSize } from '@/plotter/page-sizes';
import type { PlannedStep, Step } from './utils';
import { planSteps, stepsToNoteEnd } from './utils';

// the pen walks from the origin to the song and back at this speed
const TRAVEL_SPEED = 80; // mm/s
// speeding up and slowing down at this rate, which the motors sing as a
// glide up and down, and which is gentler on them than a sudden start or stop
const TRAVEL_ACCEL = 200; // mm/s²
// in moves of about this long
const RAMP_STEP = 20; // ms

export type AxisSteps = { a1: number; a2: number };

export type Point = { x: number; y: number };

// a point on the pen's path, reached `t` ms into the song
export type PathPoint = Point & { t: number };

export type Placement = {
  // the middle of the page, where the pen plays from, in steps from the origin
  start: AxisSteps;
  moves: PlannedStep[];
  // where the pen goes, in mm from the origin
  path: PathPoint[];
  // the area the pen keeps to, in mm from the origin
  area: Point[];
  // the size of the path, in mm
  width: number;
  height: number;
  // how many times a note turned back part-way to stay on the page
  midNoteTurns: number;
  // how many times the channels traded motors at a bar line
  swaps: number;
};

/**
 * The widest padding that still leaves room to play, in mm.
 */
export const maxPadding = (page: PageSize) =>
  Math.floor(Math.min(page.width, page.height) / 2) - 5;

export const checkPadding = (page: PageSize, padding: number) =>
  padding >= 0 && padding <= maxPadding(page)
    ? null
    : `Padding should be from 0 to ${maxPadding(page)} mm.`;

/**
 * Plans a song from the middle of the page so that the pen never leaves the
 * area within the padding, whatever the seed and the motor mode.
 */
export const placeSong = (
  steps: Step[],
  {
    page,
    padding,
    motorMode,
    randomness,
    swapChance = 0,
    seed,
  }: {
    page: PageSize;
    padding: number;
    motorMode: number;
    randomness: number;
    swapChance?: number;
    seed: number;
  },
): Placement => {
  // As in the plotter, the paper lies landscape on the plotter and a portrait
  // page only turns the view, so the page is always page.width along x.
  const start = xyDist2aaSteps(
    { x: page.width / 2, y: page.height / 2 },
    motorMode,
  );
  // Each motor moves the pen along a diagonal, so while they keep within r1
  // and r2 steps of the middle, the pen keeps within (r1 + r2) / 2 steps of it
  // both across and down. Each channel first gets room for its longest note,
  // so that no note has to turn back part-way, and then an even share of the
  // rest to wander in. When even the longest notes don't fit, the room is
  // shared by how long they are.
  const reach = mm2steps(
    Math.min(page.width, page.height) - 2 * padding,
    motorMode,
  );
  const longest = (channel: 1 | 2) =>
    stepsToNoteEnd(steps, channel).reduce((a, b) => Math.max(a, b), 0);
  const longest1 = longest(1);
  const longest2 = longest(2);
  const spare = reach - longest1 - longest2;
  const channels = Number(longest1 > 0) + Number(longest2 > 0);
  const share = (need: number) => {
    // a channel without notes never moves
    if (!need) return 0;
    const room =
      spare >= 0
        ? need + Math.floor(spare / channels)
        : Math.floor((reach * need) / (longest1 + longest2));
    return Math.max(1, room);
  };
  // when the channels may trade motors, either motor may play either one
  const even = swapChance > 0 && channels > 0;
  const r1 = even ? Math.floor(reach / 2) : share(longest1);
  const r2 = even ? Math.floor(reach / 2) : share(longest2);
  const { moves, midNoteTurns, swaps } = planSteps(steps, {
    limits: { a1: [-r1, r1], a2: [-r2, r2] },
    randomness,
    swapChance,
    seed,
  });

  const pos = { ...start };
  let t = 0;
  const path = [{ ...aaSteps2xyDist(pos, motorMode), t }];
  for (const { step1, step2, duration } of moves) {
    pos.a1 += step1;
    pos.a2 += step2;
    t += duration;
    path.push({ ...aaSteps2xyDist(pos, motorMode), t });
  }
  const bounds = path.reduce(
    (box, { x, y }) => ({
      minX: Math.min(box.minX, x),
      maxX: Math.max(box.maxX, x),
      minY: Math.min(box.minY, y),
      maxY: Math.max(box.maxY, y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const area = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ].map(([side1, side2]) =>
    aaSteps2xyDist(
      { a1: start.a1 + side1 * r1, a2: start.a2 + side2 * r2 },
      motorMode,
    ),
  );
  return {
    start,
    moves,
    path,
    area,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    midNoteTurns,
    swaps,
  };
};

/**
 * Moves that take the pen `delta` steps in a straight line, speeding up to
 * TRAVEL_SPEED and slowing down again at TRAVEL_ACCEL, a steady speed in each
 * move.
 */
const walk = (a1: number, a2: number, motorMode: number): PlannedStep[] => {
  const { x, y } = aaSteps2xyDist({ a1, a2 }, motorMode);
  const distance = Math.hypot(x, y);
  // a short walk only gets part way up to speed before slowing down again
  const top = Math.min(TRAVEL_SPEED, Math.sqrt(TRAVEL_ACCEL * distance));
  const rampTime = top / TRAVEL_ACCEL;
  const count = Math.max(1, Math.round((rampTime * 1000) / RAMP_STEP));
  const ramp = Array.from({ length: count }, (_, i) => ({
    speed: (top * (i + 0.5)) / count,
    time: rampTime / count,
  }));
  // the two ramps cover top * rampTime between them
  const steady = distance - top * rampTime;
  const pieces = [
    ...ramp,
    ...(steady > 0 ? [{ speed: top, time: steady / top }] : []),
    ...[...ramp].reverse(),
  ];
  // the steps each move ends at, rounded from how far along the walk it gets
  let covered = 0;
  const ends = pieces.map(({ speed, time }) => {
    covered += speed * time;
    const along = Math.min(covered / distance, 1);
    return { a1: Math.round(a1 * along), a2: Math.round(a2 * along) };
  });
  return pieces.map(({ time }, i) => ({
    step1: ends[i].a1 - (i ? ends[i - 1].a1 : 0),
    step2: ends[i].a2 - (i ? ends[i - 1].a2 : 0),
    duration: Math.max(1, Math.round(time * 1000)),
  }));
};

/**
 * Moves that take the pen `delta` steps in a straight line, speeding up and
 * slowing down on the way. The EBB rejects an SM that steps an axis less than
 * once every SM_MAX_MS_PER_STEP ms, so an axis with only a few steps to go
 * moves on its own afterwards.
 */
export const travel = (delta: AxisSteps, motorMode: number): PlannedStep[] => {
  const { a1, a2 } = delta;
  if (!a1 && !a2) return [];
  const moves = walk(a1, a2, motorMode);
  const time = moves.reduce((total, { duration }) => total + duration, 0);
  // twice the time leaves room for the rounding of the steps in each move
  const tooFew = (steps: number) =>
    steps !== 0 && Math.abs(steps) * SM_MAX_MS_PER_STEP < time * 2;
  if (tooFew(a1)) {
    return [
      ...walk(0, a2, motorMode),
      { step1: a1, step2: 0, duration: Math.abs(a1) },
    ];
  }
  if (tooFew(a2)) {
    return [
      ...walk(a1, 0, motorMode),
      { step1: 0, step2: a2, duration: Math.abs(a2) },
    ];
  }
  return moves;
};
