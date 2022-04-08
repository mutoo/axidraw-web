/* eslint-disable import/prefer-default-export */

import { delay } from 'utils/time';
import { runInAction } from 'mobx';

const interval = 16; // FPS = 60

export async function linearMotion(context, destination, duration) {
  const a1start = context.motor.a1;
  const a2start = context.motor.a2;
  const [a1end, a2end] = destination;
  runInAction(() => {
    context.motor.f1 = (Math.abs(a1end - a1start) * 1000) / duration;
    context.motor.f2 = (Math.abs(a2end - a2start) * 1000) / duration;
  });
  let elapsed = 0;
  const steps = Math.ceil(duration / interval);
  for (let step = 1; step <= steps; step += 1) {
    elapsed += interval;
    const s = Math.min(elapsed / duration, 1);
    const a1 = Math.round(a1start + s * (a1end - a1start));
    const a2 = Math.round(a2start + s * (a2end - a2start));
    runInAction(() => {
      context.motor.a1 = a1;
      context.motor.a2 = a2;
    });
    // eslint-disable-next-line no-await-in-loop
    await delay(Math.min(duration - elapsed, interval));
  }
  runInAction(() => {
    context.motor.f1 = 0;
    context.motor.f2 = 0;
  });
}

export async function accelMotion(context, dir, vel, accel, duration) {
  const a1start = context.motor.a1;
  const a2start = context.motor.a2;
  const [s1, s2] = dir;
  const [v1, v2] = vel;
  const [accel1, accel2] = accel;
  let elapsed = 0;
  const steps = Math.ceil(duration / interval);
  for (let step = 1; step <= steps; step += 1) {
    elapsed += interval;
    const s = Math.min(elapsed / duration, 1);
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
    // eslint-disable-next-line no-await-in-loop
    await delay(Math.min(duration - elapsed, interval));
  }
  runInAction(() => {
    context.motor.a1 = a1start + s1;
    context.motor.a2 = a2start + s2;
    context.motor.f1 = 0;
    context.motor.f2 = 0;
  });
}
