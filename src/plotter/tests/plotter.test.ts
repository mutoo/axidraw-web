import { computed } from 'mobx';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IDeviceConnector } from '@/communication/device/device';
import type { Command } from '@/communication/ebb/command';
import { xyDist2aaSteps } from '@/math/ebb';
import type { Point2D } from '@/math/geom';
import { MOTION_PEN_DOWN, PLOTTER_SPEED_MODE } from '../consts';
import plot, { firmwareProblem } from '../plotter';

type SM = [duration: number, a1: number, a2: number];

// a device that accepts every command and records the SM moves
const recordingDevice = () => {
  const moves: SM[] = [];
  const device = {
    executeCommand: (
      cmd: Command<unknown[], unknown>,
      ...params: unknown[]
    ) => {
      if (cmd.cmd === 'SM') {
        const [duration, a1, a2 = 0] = params as number[];
        moves.push([duration, a1, a2]);
      }
      // QB: the pause button has not been pressed
      return Promise.resolve(cmd.cmd === 'QB' ? 0 : '');
    },
  } as unknown as IDeviceConnector<unknown>;
  return { device, moves };
};

// the rate limits EBB firmware v2.x enforces on each axis of an SM
const acceptedByEBB = ([duration, ...steps]: SM) =>
  steps.every((s) => {
    const n = Math.abs(s);
    return (
      n === 0 ||
      (Math.floor(duration / 1311) < n && Math.floor(n / duration) <= 25)
    );
  });

const plotLine = async (to: Point2D) => {
  const { device, moves } = recordingDevice();
  const flow = plot({
    device,
    speedMode: PLOTTER_SPEED_MODE.CONSTANT,
    servoMin: computed(() => 20000),
    servoMax: computed(() => 16000),
    servoRate: computed(() => 400),
    penUpMoveSpeed: computed(() => 10000),
    penDownMoveSpeed: computed(() => 5000),
    penDownMoveAccel: computed(() => 40000),
    cornering: computed(() => 0.1),
    controlSignal: computed(() => null),
    motions: [{ line: [[0, 0], to], pen: MOTION_PEN_DOWN }],
  });
  const finished = flow.next();
  // the plotter waits for the device to finish moving before it resets
  await vi.runAllTimersAsync();
  await finished;
  return moves;
};

describe('constant speed plotting', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // near-diagonal lines move a1 by a single step, which is too slow for one
  // SM once the line takes longer than the EBB allows for one step
  it.each<[string, Point2D]>([
    ['fits in one SM', [31.3, -31.29]],
    ['needs splitting', [62.6, -62.585]],
  ])(
    'keeps a near-diagonal line that %s within its end point',
    async (_, to) => {
      vi.useFakeTimers();
      const target = xyDist2aaSteps({ x: to[0], y: to[1] });
      expect(target.a1).toBe(1);

      const moves = await plotLine(to);

      let a1 = 0;
      let a2 = 0;
      for (const move of moves) {
        expect(acceptedByEBB(move)).toBe(true);
        a1 += move[1];
        a2 += move[2];
        expect(a1).toBeGreaterThanOrEqual(0);
        expect(a1).toBeLessThanOrEqual(target.a1);
        expect(a2).toBeGreaterThanOrEqual(0);
        expect(a2).toBeLessThanOrEqual(target.a2);
      }
      // and it returns home at the end
      expect([a1, a2]).toEqual([0, 0]);
    },
  );
});

describe('firmwareProblem', () => {
  const { ACCELERATING, CONSTANT } = PLOTTER_SPEED_MODE;

  it.each([
    ['2.8.1', ACCELERATING],
    ['2.7.0', ACCELERATING],
    ['2.6.0', CONSTANT],
  ])('lets firmware %s plot in speed mode %i', (version, speedMode) => {
    expect(firmwareProblem(version, speedMode)).toBeNull();
  });

  it('needs 2.7.0 to plot with acceleration, which moves with LM', () => {
    expect(firmwareProblem('2.6.5', ACCELERATING)).toBe(
      'Acceleration needs EBB firmware 2.7.0 or later. Plot at constant velocity instead.',
    );
  });

  it.each([CONSTANT, ACCELERATING])(
    'needs 2.6.0 for any plot, which starts with SR (speed mode %i)',
    (speedMode) => {
      expect(firmwareProblem('2.5.5', speedMode)).toBe(
        'Plotting needs EBB firmware 2.6.0 or later.',
      );
    },
  );
});
