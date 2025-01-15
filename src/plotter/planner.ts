import { dist, distSq, isSamePoint, Line2D, Point2D } from '@/math/geom';
import { mm2px } from '@/math/svg';
import { MOTION_PEN_DOWN, MOTION_PEN_UP } from './consts';
import { createRTree } from './rtree';
import { MBR, pointAsMbr } from './rtree/utils';
import { transformLine } from './svg/math';
import { logger } from './utils';

export type PlanOptions = {
  /**
   * The error tolerance for two lines to be considered connected. Unit: mm
   */
  connectedError: number;
  /**
   * The distance to plan ahead. Unit: mm
   */
  planAhead: number;
  /**
   * The error tolerance for two lines to be considered flat. Unit: mm
   */
  flatLineError: number;
  /**
   * Allow to reorder the lines to reduce the pen travelling distance.
   */
  allowReorder: boolean;
  /**
   * The matrix to transform the screen coordinate to the page coordinate
   */
  screenToPageMatrix: DOMMatrix;
  /**
   * Group id for the lines
   */
  lineGroupId: number;
};

export const distPointToLine = (
  [xm, ym]: Point2D,
  [x1, y1]: Point2D,
  [x2, y2]: Point2D,
) =>
  Math.abs(xm * (y2 - y1) - ym * (x2 - x1) + x2 * y1 - x1 * y2) /
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const simplifyLines = (
  lines: Line2D[],
  opt: PlanOptions,
): { lines: Line2D[]; reduced: number } => {
  // early return for empty or single line
  if (!lines.length) return { lines: [], reduced: 0 };
  if (lines.length === 1) return { lines, reduced: 0 };

  // if flatLineError is zero, no need to simplify
  const maxError = mm2px(opt.flatLineError);
  if (!maxError) return { lines, reduced: 0 };

  const points = lines.map((l) => l[0]);
  const lastLine = lines[lines.length - 1];
  points.push(lastLine[1]);
  const len = points.length;

  // https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
  function* douglasPeucker(
    startIdx: number,
    endIdx: number,
  ): Generator<{
    reduced: number;
    line: Line2D | null;
  }> {
    if (startIdx >= endIdx) return;
    const startPoint = points[startIdx];
    const endPoint = points[endIdx];
    if (startIdx + 1 === endIdx) {
      const line: Line2D = [startPoint, endPoint];
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
      const line: Line2D = [startPoint, endPoint];
      yield { reduced, line };
    }
  }

  const dpLines = [...douglasPeucker(0, len - 1)];
  return dpLines.reduce<{ lines: Line2D[]; reduced: number }>(
    (result, entry) => {
      if (entry.line) {
        result.lines.push(entry.line);
      }

      result.reduced += entry.reduced;
      return result;
    },
    { lines: [], reduced: 0 },
  );
};

export function* planAhead(
  lines: Line2D[],
  toPaperLine: (l: Line2D) => Line2D,
  opt: PlanOptions,
): Generator<
  { line: Line2D; groupId: number },
  { skip: number; reduced?: number }
> {
  if (lines.length === 0) return { skip: 0 };

  const { connectedError } = opt;

  if (lines.length === 1) {
    yield { line: toPaperLine(lines[0]), groupId: opt.lineGroupId };
    return { skip: 1 };
  }

  // more than one line
  const connectedErrorSq = mm2px(connectedError ** 2);
  const toFlatten = [];
  let i = 0;
  let gap: Line2D | null = null;
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
    yield { line: toPaperLine(line), groupId: opt.lineGroupId };
  }

  if (gap) {
    opt.lineGroupId += 1;
    return { skip: i + 1, reduced: simplified.reduced };
  }

  // all n - 1 lines are consumed
  return { skip: i, reduced: simplified.reduced };
}

export function* walkLines(
  lines: Line2D[],
  opt: PlanOptions,
): Generator<{ line: Line2D; groupId: number }> {
  if (!lines.length) return;

  // assume the pen always start from HOME position with UP state
  const { screenToPageMatrix } = opt;
  const toPaperLine = ([p0, p1]: Line2D) =>
    transformLine(p0, p1, screenToPageMatrix);
  const planAheadPx = mm2px(opt.planAhead);
  let reduced = 0;
  for (let i = 0, len = lines.length; i < len; ) {
    const line = lines[i];
    const planWindow = [line];
    let accumulatePx = 0;
    let j = 1;
    while (accumulatePx < planAheadPx) {
      const lineAhead = lines[i + j] as Line2D | undefined;
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

export const defaultPlanOptions: Omit<
  PlanOptions,
  'lineGroupId' | 'screenToPageMatrix'
> = {
  connectedError: 0.2,
  planAhead: 10,
  flatLineError: 0.1,
  allowReorder: false,
};

export function revertLineGroup(lineGroup: Line2D[]): Line2D[] {
  return lineGroup.reverse().map(([p0, p1]) => [p1, p0]);
}

export function reorderLineGroups(lineGroups: Line2D[][]): Line2D[][] {
  type EntryType = {
    id: number;
    mbr: MBR;
    groupIdx: number;
    pairId?: number;
    isEndPoint?: boolean;
  };
  const rtree = createRTree<EntryType>(2, 4);
  const entryMap: Record<number, EntryType> = {};
  let pointId = 1;

  function createEntry(point: Point2D, groupIdx: number) {
    const entry: EntryType = {
      id: pointId,
      mbr: pointAsMbr(point),
      groupIdx: groupIdx,
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

  const context: { pos: Point2D } = { pos: [0, 0] };
  type GrouopType = { idx: number; revert?: boolean };
  const sortedGroups: GrouopType[] = [];

  for (;;) {
    const id = rtree.nnSearch(context.pos, (e) => e.id);
    if (!id) {
      // no more points in the rtree
      break;
    }
    const entry = entryMap[id];
    rtree.remove(entry.mbr, (e) => e.id === id);
    const pairId = entry.pairId!;
    const pairEntry = entryMap[pairId];
    rtree.remove(pairEntry.mbr, (e) => e.id === pairId);
    const selectedGroup: GrouopType = { idx: entry.groupIdx };
    if (entry.isEndPoint) {
      selectedGroup.revert = true;
    }
    sortedGroups.push(selectedGroup);
    context.pos = pairEntry.mbr.p0;
  }

  return sortedGroups.map((g) => {
    return g.revert ? revertLineGroup(lineGroups[g.idx]) : lineGroups[g.idx];
  });
}

export type Motion = {
  line: Line2D;
  pen: number;
};

export default function plan(
  lines: Line2D[],
  opt: Partial<PlanOptions> & Pick<PlanOptions, 'screenToPageMatrix'>,
): Motion[] {
  const mergedOptions: PlanOptions = {
    ...defaultPlanOptions,
    ...opt,
    lineGroupId: 0,
  };
  let lastLineGroupId = null;
  let lineGroups: Line2D[][] = [];
  let lineGroup: Line2D[] | null = null;
  for (const line of walkLines(lines, mergedOptions)) {
    if (lastLineGroupId !== line.groupId) {
      lineGroup = [];
      lineGroups.push(lineGroup);
      lastLineGroupId = line.groupId;
    }
    lineGroup!.push(line.line);
  }
  if (mergedOptions.allowReorder) {
    lineGroups = reorderLineGroups(lineGroups);
  }

  const motions: Motion[] = [];
  let lastPoint: Point2D = [0, 0];
  const connectedErrorSq =
    mergedOptions.connectedError * mergedOptions.connectedError;
  for (const lg of lineGroups) {
    const firstPoint = lg[0][0];
    if (
      !isSamePoint(lastPoint, firstPoint) &&
      distSq(lastPoint, firstPoint) > connectedErrorSq
    ) {
      motions.push({
        line: [lastPoint, firstPoint],
        pen: MOTION_PEN_UP,
      });
    }
    motions.push(...lg.map((line) => ({ line, pen: MOTION_PEN_DOWN })));
    lastPoint = lg[lg.length - 1][1];
  }
  motions.push({ line: [lastPoint, [0, 0]], pen: MOTION_PEN_UP });
  return motions;
}
