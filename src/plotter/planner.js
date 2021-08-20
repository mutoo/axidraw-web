import { dist, distSq, isSamePoint } from 'math/geom';
import { mm2px } from 'math/svg';
import { transformLine } from './svg/math';
import { logger } from './utils';
import { createRTree } from './rtree';
import { pointAsMbr } from './rtree/utils';
import { MOTION_PEN_DOWN, MOTION_PEN_UP } from './consts';

export const distPointToLine = ([xm, ym], [x1, y1], [x2, y2]) =>
  Math.abs(xm * (y2 - y1) - ym * (x2 - x1) + x2 * y1 - x1 * y2) /
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const simplifyLines = (lines, opt) => {
  if (!lines?.length) return { lines: [] };
  if (lines.length === 1) return { lines };
  const maxError = mm2px(opt.flatLineError);
  if (!maxError) return { lines };
  const points = lines.map((l) => l[0]);
  const lastLine = lines[lines.length - 1];
  points.push(lastLine[1]);
  const len = points.length;

  // https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
  function* douglasPeucker(startIdx, endIdx) {
    if (startIdx >= endIdx) return;
    const startPoint = points[startIdx];
    const endPoint = points[endIdx];
    if (startIdx + 1 === endIdx) {
      const line = [startPoint, endPoint];
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
        const midIdx = Math.floor((startIdx + endIdx) / 2);
        yield* douglasPeucker(startIdx, midIdx);
        yield* douglasPeucker(midIdx, endIdx);
      }
      return;
    }
    for (let i = startIdx + 1; i <= endIdx - 1; i += 1) {
      const d = distPointToLine(points[i], startPoint, endPoint);
      if (d > maxDistance) {
        maxDistancePointIdx = i;
        maxDistance = d;
      }
    }
    if (maxDistance > maxError) {
      yield* douglasPeucker(startIdx, maxDistancePointIdx);
      yield* douglasPeucker(maxDistancePointIdx, endIdx);
    } else {
      const reduced = endIdx - startIdx - 1;
      const line = [startPoint, endPoint];
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
    yield { line: toPaperLine(lines[0]), lineGroupId: opt.lindGroupId };
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
    toFlatten.push(line);
    gap = [line[1], nextLine[0]];
    const gapLen = distSq(gap[0], gap[1]);
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
    yield { line: toPaperLine(line), lineGroupId: opt.lindGroupId };
  }

  if (gap) {
    opt.lindGroupId += 1;
    return { skip: i + 1, reduced: simplified.reduced };
  }

  // all n - 1 lines are consumed
  return { skip: i, reduced: simplified.reduced };
}

export function* walkLines(lines, opt) {
  if (!lines || !lines.length) return;

  const { screenToPageMatrix } = opt;
  // assume the pen always start from HOME position with UP state
  const toPaperLine = ([p0, p1]) => transformLine(p0, p1, screenToPageMatrix);
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
      accumulatePx += dist(lineAhead[0], lineAhead[1]);
      planWindow.push(lineAhead);
      j += 1;
    }
    // planAhead and set down how many lines are consumed
    const result = yield* planAhead(planWindow, toPaperLine, opt);
    i += result.skip;
    reduced += result.reduced ?? 0;
  }
  logger.debug(`Reduced lines ${reduced}`);
}

export const defaultPlanOptions = {
  connectedError: 0.2, // unit mm
  planAhead: 10, // unit mm
  flatLineError: 0.1, // unit mm
};

export function revertLineGroup(lingGroup) {
  return lingGroup.reverse().map(([p0, p1]) => [p1, p0]);
}

export function reorderLineGroups(lineGroups) {
  const rtree = createRTree(2, 4);
  const entryMap = {};
  let pointId = 1;

  function createEntry(point, groupId) {
    const entry = {
      id: pointId,
      mbr: pointAsMbr(point),
      groupId,
    };
    entryMap[pointId] = entry;
    pointId += 1;
    return entry;
  }

  lineGroups.forEach((lineGroup, idx) => {
    const startEntry = createEntry(lineGroup[0][0], idx);
    const endPointEntry = createEntry(lineGroup[lineGroup.length - 1][1], idx);
    startEntry.pairId = endPointEntry.id;
    rtree.insert(startEntry);
    endPointEntry.pairId = startEntry.id;
    endPointEntry.isEndPoint = true;
    rtree.insert(endPointEntry);
  });

  const context = { pos: [0, 0] };
  const sortedGroups = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const id = rtree.nnSearch(context.pos);
    if (!id) {
      break;
    }
    const entry = entryMap[id];
    rtree.remove(entry);
    const pairEntry = entryMap[entry.pairId];
    rtree.remove(pairEntry);
    const selectedGroup = { id: entry.groupId };
    if (entry.isEndPoint) {
      selectedGroup.revert = true;
    }
    sortedGroups.push(selectedGroup);
    context.pos = pairEntry.mbr.p0;
  }

  return sortedGroups.map((g) => {
    return g.revert ? revertLineGroup(lineGroups[g.id]) : lineGroups[g.id];
  });
}

export default function plan(lines, opt = {}) {
  const mergedOptions = { ...defaultPlanOptions, ...opt };
  mergedOptions.lindGroupId = 0;
  let lastLineGroupId = null;
  let lineGroups = [];
  let lineGroup = null;
  for (const groupedLine of walkLines(lines, mergedOptions)) {
    if (lastLineGroupId !== groupedLine.lineGroupId) {
      lineGroup = [];
      lineGroups.push(lineGroup);
      lastLineGroupId = groupedLine.lineGroupId;
    }
    lineGroup.push(groupedLine.line);
  }
  lineGroups = reorderLineGroups(lineGroups, mergedOptions);
  const motions = [];

  let lastPoint = [0, 0];
  for (const lg of lineGroups) {
    const firstPoint = lg[0][0];
    motions.push({ line: [lastPoint, firstPoint], pen: MOTION_PEN_UP });
    motions.push(...lg.map((line) => ({ line, pen: MOTION_PEN_DOWN })));
    lastPoint = lg[lg.length - 1][1];
  }
  motions.push({ line: [lastPoint, [0, 0]], pen: MOTION_PEN_UP });
  return motions;
}
