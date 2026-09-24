import { SM_MAX_MS_PER_STEP } from '@/communication/ebb/constants';
import type { PageSize } from '@/containers/plotter/presenters/page';
import {
  PAGE_SIZE_A4,
  PAGE_SIZE_A5,
  pageSizes as plotterPageSizes,
} from '@/containers/plotter/presenters/page';
import { aaSteps2xyDist, mm2steps, xyDist2aaSteps } from '@/math/ebb';
import type { PlannedStep, Step } from './utils';
import { planSteps, stepsToNoteEnd } from './utils';

export const pageSizes = plotterPageSizes.filter(
  ({ type }) => type === PAGE_SIZE_A4 || type === PAGE_SIZE_A5,
);

// the pen walks from the origin to the song and back at this speed
const TRAVEL_SPEED = 50; // mm/s

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
 * Moves that take the pen `delta` steps in a straight line at TRAVEL_SPEED.
 * The EBB rejects an SM that steps an axis less than once every
 * SM_MAX_MS_PER_STEP ms, so an axis with only a few steps to go moves on its
 * own afterwards.
 */
export const travel = (delta: AxisSteps, motorMode: number): PlannedStep[] => {
  const { a1, a2 } = delta;
  if (!a1 && !a2) return [];
  const { x, y } = aaSteps2xyDist(delta, motorMode);
  const duration = Math.max(
    1,
    Math.round((Math.hypot(x, y) / TRAVEL_SPEED) * 1000),
  );
  const tooFew = (steps: number) =>
    steps !== 0 && Math.abs(steps) * SM_MAX_MS_PER_STEP < duration;
  if (tooFew(a1)) {
    return [
      { step1: 0, step2: a2, duration },
      { step1: a1, step2: 0, duration: Math.abs(a1) },
    ];
  }
  if (tooFew(a2)) {
    return [
      { step1: a1, step2: 0, duration },
      { step1: 0, step2: a2, duration: Math.abs(a2) },
    ];
  }
  return [{ step1: a1, step2: a2, duration }];
};
