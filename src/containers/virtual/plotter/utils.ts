import { runInAction } from 'mobx';
import { Point2D, Vector2D } from '@/math/geom';
import { delay } from '@/utils/time';
import { VirtualPlotterContext } from '.';

const interval = 16; // FPS = 60

export async function linearMotion(
  context: VirtualPlotterContext,
  destination: Point2D,
  duration: number,
) {
  const a1start = context.motor.a1;
  const a2start = context.motor.a2;
  const [a1end, a2end] = destination;
  runInAction(() => {
    context.motor.f1 = (Math.abs(a1end - a1start) * 1000) / duration;
    context.motor.f2 = (Math.abs(a2end - a2start) * 1000) / duration;
  });
  let elapsed = 0;
  const steps = Math.ceil(duration / interval);
  for (let step = 0; step < steps; step += 1) {
    const s = Math.min((elapsed + interval) / duration, 1);
    const a1 = Math.round(a1start + s * (a1end - a1start));
    const a2 = Math.round(a2start + s * (a2end - a2start));
    runInAction(() => {
      context.motor.a1 = a1;
      context.motor.a2 = a2;
    });
    await delay(Math.min(duration - elapsed, interval));
    elapsed += interval;
  }
  runInAction(() => {
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
  let elapsed = 0;
  const steps = Math.ceil(duration / interval);
  for (let step = 0; step < steps; step += 1) {
    const s = Math.min((elapsed + interval) / duration, 1);
    const t = (s * duration) / 1000;
    const d1 = Math.sign(s1) * Math.round(v1 * t + (accel1 * t * t) / 2);
    const d2 = Math.sign(s2) * Math.round(v2 * t + (accel2 * t * t) / 2);
    runInAction(() => {
      const { a1: a1o, a2: a2o } = context.motor;
      context.motor.a1 = a1start + d1;
      context.motor.a2 = a2start + d2;
      context.motor.f1 = (Math.abs(a1start + d1 - a1o) * 1000) / interval;
      context.motor.f2 = (Math.abs(a2start + d2 - a2o) * 1000) / interval;
    });
    await delay(Math.min(duration - elapsed, interval));
    elapsed += interval;
  }
  runInAction(() => {
    context.motor.a1 = a1start + s1;
    context.motor.a2 = a2start + s2;
    context.motor.f1 = 0;
    context.motor.f2 = 0;
  });
}
