import { lineLengthSQ, lineLength, isSamePoint } from '../math/geom';
import { mm2px } from '../math/svg';
import { transformLine } from './svg/math';
import { logger } from './utils';
import { MOTION_PEN_DOWN, MOTION_PEN_UP } from './consts';

export const distPointToLine = ([xm, ym], [x1, y1], [x2, y2]) =>
  Math.abs(xm * (y2 - y1) - ym * (x2 - x1) + x2 * y1 - x1 * y2) /
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const simplifyLines = (lines, opt) => {
  if (!lines?.length) return { lines: [] };
  if (lines.length === 1) return { lines };
  const maxError = mm2px(opt.flatLineError);
  if (!maxError) return { lines };
  const points = lines.map((l) => [l[0], l[1]]);
  const lastLine = lines[lines.length - 1];
  points.push([lastLine[2], lastLine[3]]);
  const len = points.length;

  // https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
  function* douglasPeucker(startIdx, endIdx) {
    if (startIdx >= endIdx) return;
    const startPoint = points[startIdx];
    const endPoint = points[endIdx];
    if (startIdx + 1 === endIdx) {
      const line = [...startPoint, ...endPoint];
      yield { reduced: 0, line };
      return;
    }
    let maxDistancePointIdx = -1;
    let maxDistance = Number.MIN_VALUE;
    const isRing = isSamePoint(startPoint, endPoint);
    if (isRing) {
      if (startIdx + 1 === endIdx) {
        // the only two point collapse, ignore it
        yield { reduced: 1, line: null };
      } else {
        const midIdx = Math.floor((endIdx - startIdx) / 2);
        yield* douglasPeucker(startIdx, midIdx);
        yield* douglasPeucker(midIdx, endIdx);
      }
      return;
    }
    for (let i = startIdx + 1; i <= endIdx - 1; i += 1) {
      const dist = distPointToLine(points[i], startPoint, endPoint);
      if (dist > maxDistance) {
        maxDistancePointIdx = i;
        maxDistance = dist;
      }
    }
    if (maxDistance > maxError) {
      yield* douglasPeucker(startIdx, maxDistancePointIdx);
      yield* douglasPeucker(maxDistancePointIdx, endIdx);
    } else {
      const reduced = endIdx - startIdx - 1;
      const line = [...startPoint, ...endPoint];
      yield { reduced, line };
    }
  }

  const dpLines = [...douglasPeucker(0, len - 1)];
  return dpLines.reduce(
    (result, entry) => {
      if (entry.line) {
        result.lines.push(entry.line);
      }
      // eslint-disable-next-line no-param-reassign
      result.reduced += entry.reduced ?? 0;
      return result;
    },
    { lines: [], reduced: 0 },
  );
};

export function* planAhead(lines, toPaperLine, opt) {
  if (!lines || lines.length === 0) return { skip: 0 };

  const { connectedError } = opt;

  if (lines.length === 1) {
    yield { line: toPaperLine(lines[0]), pen: MOTION_PEN_DOWN };
    return { skip: 1 };
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

  const simplified = simplifyLines(toFlatten, opt);
  for (const line of simplified.lines) {
    yield { line: toPaperLine(line), pen: MOTION_PEN_DOWN };
  }

  if (gap) {
    yield { line: toPaperLine(gap), pen: MOTION_PEN_UP };
    return { skip: i + 1, reduced: simplified.reduced };
  }

  // all n - 1 lines are consumed
  return { skip: i, reduced: simplified.reduced };
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
  const planAheadPx = mm2px(opt.planAhead);
  let reduced = 0;
  for (let i = 0, len = lines.length; i < len; ) {
    const line = lines[i];
    const planWindow = [line];
    let accumulatePx = 0;
    let j = 1;
    while (accumulatePx < planAheadPx) {
      const lineAhead = lines[i + j];
      // ensure at least two lines in the slide window unless last line
      if (!lineAhead) break;
      accumulatePx += lineLength(lineAhead);
      planWindow.push(lineAhead);
      j += 1;
    }
    // planAhead and set down how many lines are consumed
    const result = yield* planAhead(planWindow, toPaperLine, opt);
    i += result.skip;
    reduced += result.reduced ?? 0;
  }
  logger.info(`Reduced lines ${reduced}`);
  const lastLine = lines[lines.length - 1];
  context.x = lastLine[2];
  context.y = lastLine[3];
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
