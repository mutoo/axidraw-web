/* eslint-disable import/prefer-default-export */

import { delay } from 'utils/time';

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
    context.motor.a1 = a1;
    context.motor.a2 = a2;
    // eslint-disable-next-line no-await-in-loop
    await delay(1000 / FPS);
  }
}
