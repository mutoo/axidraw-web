import { distSQ } from '../../math/geom.js';

export const MOTION_PEN_UP = 1;
export const MOTION_PEN_DOWN = 0;

export function* walkLines(lines, opt) {
  // assume the pen always start from HOME position with UP state
  const context = { x: 0, y: 0, pen: MOTION_PEN_UP };
  const connectedErrorSq = opt.connectedError ** 2;
  for (const line of lines) {
    const motion = [context.x, context.y, line[0], line[1]];
    if (distSQ(...motion) > connectedErrorSq) {
      yield [...motion, MOTION_PEN_UP];
    }
    yield [...line, MOTION_PEN_DOWN];
    // eslint-disable-next-line prefer-destructuring
    context.x = line[2];
    // eslint-disable-next-line prefer-destructuring
    context.y = line[3];
  }
}

export default function plan(lines, opt = { connectedError: 0.2 }) {
  return [...walkLines(lines, opt)];
}
