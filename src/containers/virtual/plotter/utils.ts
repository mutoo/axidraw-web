import { runInAction } from 'mobx';
import type { Point2D, Vector2D } from '@/math/geom';
import { delay } from '@/utils/time';
import type { VirtualPlotterContext } from '.';

const interval = 16; // FPS = 60

export const PEN_UP = 1;
export const PEN_DOWN = 0;

// where the pen is, in 1/16 steps
export const penPosition = ({ motor }: VirtualPlotterContext) => {
  const stepSize = 2 ** (motor.stepMode - 1);
  return {
    a1: motor.home1 + motor.a1 * stepSize,
    a2: motor.home2 + motor.a2 * stepSize,
  };
};

// change the step counters or step mode without moving the pen
export const keepPenInPlace = (
  context: VirtualPlotterContext,
  update: () => void,
) => {
  const { a1, a2 } = penPosition(context);
  update();
  const { motor } = context;
  const stepSize = 2 ** (motor.stepMode - 1);
  motor.home1 = a1 - motor.a1 * stepSize;
  motor.home2 = a2 - motor.a2 * stepSize;
};

// move the pen to a1, a2 (in 1/16 steps) the way a hand pushes the carriage:
// the motors don't turn, so the step counters stay as they are
export const movePenByHand = (
  context: VirtualPlotterContext,
  { a1, a2 }: { a1: number; a2: number },
) => {
  const { motor } = context;
  const stepSize = 2 ** (motor.stepMode - 1);
  motor.home1 = a1 - motor.a1 * stepSize;
  motor.home2 = a2 - motor.a2 * stepSize;
};

// the carriage may be moved by hand once the plotter is idle with the pen up
export const isFreeMode = (context: VirtualPlotterContext) =>
  context.idle && context.pen === PEN_UP;

/**
 * Play `duration` ms of plotter time at the plotter's speed, which may change
 * while it plays. `frame` gets the plotter time played so far and the wall
 * time since the last frame, both in ms. It isn't called for the end of the
 * motion, nor at all when the plotter runs at infinite speed: the caller puts
 * everything where the motion ends once this resolves.
 */
export async function play(
  context: VirtualPlotterContext,
  duration: number,
  frame?: (t: number, dt: number) => void,
) {
  if (!(duration > 0) || !Number.isFinite(duration)) return;
  if (context.speed === Infinity) return;
  frame?.(0, 0);
  let t = 0;
  let last = performance.now();
  for (;;) {
    const wait = Math.min(interval, (duration - t) / context.speed);
    await delay(wait);
    if (context.speed === Infinity) return;
    const now = performance.now();
    // a timer never fires early, however coarse the clock
    const dt = Math.max(now - last, wait);
    last = now;
    t += dt * context.speed;
    if (t >= duration) return;
    frame?.(t, dt);
  }
}

export async function linearMotion(
  context: VirtualPlotterContext,
  destination: Point2D,
  duration: number,
) {
  const a1start = context.motor.a1;
  const a2start = context.motor.a2;
  const [a1end, a2end] = destination;
  await play(context, duration, (t) => {
    const s = t / duration;
    runInAction(() => {
      context.motor.a1 = Math.round(a1start + s * (a1end - a1start));
      context.motor.a2 = Math.round(a2start + s * (a2end - a2start));
      // steps per second of wall time
      context.motor.f1 =
        (Math.abs(a1end - a1start) * 1000 * context.speed) / duration;
      context.motor.f2 =
        (Math.abs(a2end - a2start) * 1000 * context.speed) / duration;
    });
  });
  runInAction(() => {
    context.motor.a1 = a1end;
    context.motor.a2 = a2end;
    context.motor.f1 = 0;
    context.motor.f2 = 0;
  });
}

export async function accelMotion(
  context: VirtualPlotterContext,
  dir: Vector2D,
  vel: Vector2D,
  accel: Vector2D,
  duration: number,
) {
  const a1start = context.motor.a1;
  const a2start = context.motor.a2;
  const [s1, s2] = dir;
  const [v1, v2] = vel;
  const [accel1, accel2] = accel;
  await play(context, duration, (ms, dt) => {
    const t = ms / 1000;
    const d1 = Math.sign(s1) * Math.round(v1 * t + (accel1 * t * t) / 2);
    const d2 = Math.sign(s2) * Math.round(v2 * t + (accel2 * t * t) / 2);
    runInAction(() => {
      const { a1: a1o, a2: a2o } = context.motor;
      context.motor.a1 = a1start + d1;
      context.motor.a2 = a2start + d2;
      if (dt > 0) {
        context.motor.f1 = (Math.abs(a1start + d1 - a1o) * 1000) / dt;
        context.motor.f2 = (Math.abs(a2start + d2 - a2o) * 1000) / dt;
      }
    });
  });
  runInAction(() => {
    context.motor.a1 = a1start + s1;
    context.motor.a2 = a2start + s2;
    context.motor.f1 = 0;
    context.motor.f2 = 0;
  });
}
