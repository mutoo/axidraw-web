/* eslint-disable import/prefer-default-export */

import { delay } from 'utils/time';
import { runInAction } from 'mobx';

const FPS = 60;

export async function linearMotion(context, destination, duration) {
  const steps = Math.ceil((FPS * duration) / 1000);
  const a1start = context.motor.a1;
  const a2start = context.motor.a2;
  const [a1end, a2end] = destination;
  for (let step = 1; step <= steps; step += 1) {
    const s = step / steps;
    const a1 = Math.round(a1start + s * (a1end - a1start));
    const a2 = Math.round(a2start + s * (a2end - a2start));
    runInAction(() => {
      const { a1: a1o, a2: a2o } = context.motor;
      context.motor.a1 = a1;
      context.motor.a2 = a2;
      context.motor.f1 = Math.abs(a1 - a1o) * FPS;
      context.motor.f2 = Math.abs(a2 - a2o) * FPS;
    });
    // eslint-disable-next-line no-await-in-loop
    await delay(1000 / FPS);
  }
  runInAction(() => {
    context.motor.f1 = 0;
    context.motor.f2 = 0;
  });
}

export async function accelMotion(context, vel, accel, duration) {
  const steps = Math.ceil((FPS * duration) / 1000);
  const a1start = context.motor.a1;
  const a2start = context.motor.a2;
  const [v1, v2] = vel;
  const [accel1, accel2] = accel;
  for (let step = 1; step <= steps; step += 1) {
    const t = ((step / steps) * duration) / 1000;
    const a1 = Math.round(a1start + v1 * t + (accel1 * t * t) / 2);
    const a2 = Math.round(a2start + v2 * t + (accel2 * t * t) / 2);
    runInAction(() => {
      const { a1: a1o, a2: a2o } = context.motor;
      context.motor.a1 = a1;
      context.motor.a2 = a2;
      context.motor.f1 = Math.abs(a1 - a1o) * FPS;
      context.motor.f2 = Math.abs(a2 - a2o) * FPS;
    });
    // eslint-disable-next-line no-await-in-loop
    await delay(1000 / FPS);
  }
  runInAction(() => {
    context.motor.f1 = 0;
    context.motor.f2 = 0;
  });
}
