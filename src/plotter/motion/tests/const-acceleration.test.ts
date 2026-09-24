import { computed } from 'mobx';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { xyDist2aaSteps } from '@/math/ebb';
import type { Line2D, Point2D } from '@/math/geom';
import {
  MOTION_PEN_DOWN,
  MOTION_PEN_UP,
  PLOTTER_SPEED_MODE,
} from '../../consts';
import estimate from '../../estimator';
import { logger } from '../../utils';
import { estimateExitRate } from '../const-acceleration';

const ACCEL = 40000; // steps/s^2
const MAX_RATE = 5000; // steps/s

type Motion = { line: Line2D; pen: number };

const down = (from: Point2D, to: Point2D): Motion => ({
  line: [from, to],
  pen: MOTION_PEN_DOWN,
});

const up = (from: Point2D, to: Point2D): Motion => ({
  line: [from, to],
  pen: MOTION_PEN_UP,
});

// a straight pen-down run along x made of segments of the given lengths (mm)
const straightRun = (lengths: number[]): Motion[] => {
  const motions: Motion[] = [];
  let x = 0;
  for (const len of lengths) {
    motions.push(down([x, 0], [x + len, 0]));
    x += len;
  }
  motions.push(up([x, 0], [0, 0]));
  return motions;
};

// length of a horizontal move in motor (a1/a2) steps
const aaLength = (mm: number) => {
  const { a1, a2 } = xyDist2aaSteps({ x: mm, y: 0 });
  return Math.hypot(a1, a2);
};

describe('estimateExitRate', () => {
  it('lets a straight run still stop at its end, however it is split', () => {
    // 1mm segment followed by 2mm of straight line before the pen lifts
    for (const rest of [[2], [1, 1], [0.5, 0.5, 0.5, 0.5]]) {
      // each segment is rounded to whole motor steps on its own
      const remaining = rest.reduce((sum, len) => sum + aaLength(len), 0);
      const expected = Math.sqrt(2 * ACCEL * remaining);
      const exitRate = estimateExitRate(
        straightRun([1, ...rest]),
        0,
        MAX_RATE,
        MAX_RATE,
        ACCEL,
        aaLength(1),
      );
      expect(Math.abs(exitRate - expected)).toBeLessThanOrEqual(1);
    }
  });

  it('caps the exit speed at what the segment can reach from its entry', () => {
    const vEnter = 1000;
    const exitRate = estimateExitRate(
      straightRun([1, 50]),
      0,
      vEnter,
      MAX_RATE,
      ACCEL,
      aaLength(1),
    );
    const expected = Math.sqrt(vEnter ** 2 + 2 * ACCEL * aaLength(1));
    expect(Math.abs(exitRate - expected)).toBeLessThanOrEqual(1);
  });
});

describe('acceleration planning', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('only plans speeds that can be reached and stopped from', () => {
    const motions: Motion[] = [];
    let pos: Point2D = [0, 0];
    const lineTo = (p: Point2D) => {
      motions.push(down(pos, p));
      pos = p;
    };
    // circle, zigzag with sharp corners, and a run of very short segments
    motions.push(up(pos, [70, 50]));
    pos = [70, 50];
    for (let i = 1; i <= 72; i += 1) {
      const a = (i / 72) * 2 * Math.PI;
      lineTo([50 + 20 * Math.cos(a), 50 + 20 * Math.sin(a)]);
    }
    for (let i = 1; i <= 10; i += 1) lineTo([70 + i * 5, 50 + (i % 2) * 8]);
    for (let i = 1; i <= 40; i += 1) lineTo([120 + i * 0.05, 58]);
    motions.push(up(pos, [0, 0]));

    const shortfalls: number[] = [];
    vi.spyOn(logger, 'error').mockImplementation((...args: unknown[]) => {
      const match = /room to acc: (-?\d+)/.exec(String(args[0]));
      if (match) shortfalls.push(Number(match[1]));
    });
    const time = estimate({
      motions,
      speedMode: PLOTTER_SPEED_MODE.ACCELERATING,
      servoMin: computed(() => 20000),
      servoMax: computed(() => 16000),
      servoRate: computed(() => 400),
      penUpMoveSpeed: computed(() => 10000),
      penDownMoveSpeed: computed(() => MAX_RATE),
      penDownMoveAccel: computed(() => ACCEL),
      cornering: computed(() => 0.1),
    });
    expect(time).toBeGreaterThan(0);
    // accelMotion tolerates the few steps lost to integer rounding
    expect(shortfalls.filter((steps) => steps < -10)).toEqual([]);
  });
});
