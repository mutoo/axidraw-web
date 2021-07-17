import { distSQ } from '../math/geom';
import { mm2px } from '../math/svg';
import { transformLine } from './parser/svg-math';

export const MOTION_PEN_UP = 1;
export const MOTION_PEN_DOWN = 0;

export function* walkLines(lines, opt) {
  // assume the pen always start from HOME position with UP state
  const { screenToPageMatrix, origin } = opt;
  const context = { x: origin[0], y: origin[1], pen: MOTION_PEN_UP };
  const connectedErrorSq = mm2px(opt.connectedError ** 2);
  const toPaperLine = (line) =>
    transformLine([line[0], line[1]], [line[2], line[3]], screenToPageMatrix);

  for (const line of lines) {
    const motion = [context.x, context.y, line[0], line[1]];
    if (distSQ(...motion) > connectedErrorSq) {
      yield [...toPaperLine(motion), MOTION_PEN_UP];
    }
    yield [...toPaperLine(line), MOTION_PEN_DOWN];
    // eslint-disable-next-line prefer-destructuring
    context.x = line[2];
    // eslint-disable-next-line prefer-destructuring
    context.y = line[3];
  }
  // return to home
  yield [
    ...toPaperLine([context.x, context.y, origin[0], origin[1]]),
    MOTION_PEN_UP,
  ];
}

export const defaultPlanOptions = {
  connectedError: 0.2, // unit mm
};

export default function plan(lines, opt = {}) {
  return [...walkLines(lines, { ...defaultPlanOptions, ...opt })];
}
