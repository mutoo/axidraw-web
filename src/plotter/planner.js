import { lineLengthSQ, lineLength } from '../math/geom';
import { mm2px } from '../math/svg';
import { transformLine } from './parser/svg-math';
import { logger } from './utils';

export const MOTION_PEN_UP = 1;
export const MOTION_PEN_DOWN = 0;

export const distPointToLine = ([xm, ym], [x1, y1], [x2, y2]) =>
  Math.abs(xm * (y2 - y1) - ym * (x2 - x1) + x2 * y1 - x1 * y2) /
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const simplifyLines = (lines, opt) => {
  if (!lines?.length) return [];
  if (lines.length === 1) return lines;
  const points = lines.map((l) => [l[0], l[1]]);
  const lastLine = lines[lines.length - 1];
  points.push([lastLine[2], lastLine[3]]);
  const maxError = mm2px(opt.flatLineError);
  const len = points.length;

  // https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
  function* douglasPeucker(startIdx, endIdx) {
    if (startIdx >= endIdx) return;
    const startPoint = points[startIdx];
    const endPoint = points[endIdx];
    let maxDistancePointIdx = -1;
    let maxDistance = Number.MIN_VALUE;
    const isRing =
      startPoint[0] === endPoint[0] && startPoint[1] === endPoint[1];
    const ghostEndPoint = isRing ? [endPoint[0] + 1, endPoint[1]] : endPoint;
    for (let i = startIdx + 1; i < endIdx; i += 1) {
      const dist = distPointToLine(points[i], startPoint, ghostEndPoint);
      if (dist > maxDistance) {
        maxDistancePointIdx = i;
        maxDistance = dist;
      }
    }
    if (maxDistance > maxError) {
      yield* douglasPeucker(startIdx, maxDistancePointIdx);
      yield* douglasPeucker(maxDistancePointIdx, endIdx);
    } else {
      yield [...startPoint, ...endPoint];
    }
  }

  return [...douglasPeucker(0, len - 1)];
};

export function* planAhead(lines, toPaperLine, context, opt) {
  if (!lines || lines.length === 0) return 0;

  const { connectedError } = opt;

  if (lines.length === 1) {
    yield { line: toPaperLine(lines[0]), pen: MOTION_PEN_DOWN };
    return 1;
  }

  // more than one line
  const connectedErrorSq = mm2px(connectedError ** 2);
  const toFlatten = [];
  let i = 0;
  let gap = null;
  for (let len = lines.length; i < len - 1; i += 1) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    gap = [line[2], line[3], nextLine[0], nextLine[1]];
    toFlatten.push(line);
    const gapLen = lineLengthSQ(gap);
    if (gapLen > connectedErrorSq) {
      break;
    }
    if (gapLen > 0) {
      toFlatten.push(gap);
    }
    gap = null;
  }

  const simplifiedLines = simplifyLines(toFlatten, opt);
  for (const line of simplifiedLines) {
    yield { line: toPaperLine(line), pen: MOTION_PEN_DOWN };
  }

  if (gap) {
    yield { line: toPaperLine(gap), pen: MOTION_PEN_UP };
    context.x = gap[2];
    context.y = gap[3];
    return i + 1;
  }

  // all n - 1 lines are consumed
  const lastLine = lines[i];
  context.x = lastLine[0];
  context.y = lastLine[1];
  return i;
}

export function* walkLines(lines, opt) {
  if (!lines || !lines.length) return;

  const { screenToPageMatrix, origin } = opt;
  // assume the pen always start from HOME position with UP state
  const context = { x: origin[0], y: origin[1], pen: MOTION_PEN_UP };
  const toPaperLine = (line) =>
    transformLine([line[0], line[1]], [line[2], line[3]], screenToPageMatrix);
  // move to starting point
  const firstLine = lines[0];
  yield {
    line: toPaperLine([context.x, context.y, firstLine[0], firstLine[1]]),
    pen: MOTION_PEN_UP,
  };
  context.x = firstLine[0];
  context.y = firstLine[1];
  const planAheadPx = mm2px(opt.planAhead);
  let reduced = 0;
  for (let i = 0, len = lines.length; i < len; ) {
    const line = lines[i];
    // ensure at least two lines in the slide window unless last line
    const planWindow = [line];
    let accumulatePx = 0;
    let j = 1;
    while (accumulatePx < planAheadPx) {
      const lineAhead = lines[i + j];
      if (!lineAhead) break;
      accumulatePx += lineLength(lineAhead);
      planWindow.push(lineAhead);
      j += 1;
    }
    // planAhead and set down how many lines are consumed
    const skipCount = yield* planAhead(planWindow, toPaperLine, context, opt);
    i += skipCount;
    reduced += skipCount - 1;
  }
  logger.info(`Reduced lines ${reduced}`);
  // homing
  yield {
    line: toPaperLine([context.x, context.y, origin[0], origin[1]]),
    pen: MOTION_PEN_UP,
  };
}

export const defaultPlanOptions = {
  connectedError: 0.2, // unit mm
  planAhead: 10, // unit mm
  flatLineError: 0.1, // unit mm
};

export default function plan(lines, opt = {}) {
  return [...walkLines(lines, { ...defaultPlanOptions, ...opt })];
}
