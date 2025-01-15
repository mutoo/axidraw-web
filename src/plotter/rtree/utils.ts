import { Point2D } from '@/math/geom';
import { DataNode, InternalEntry } from '.';

export type MBR = { p0: Point2D; p1: Point2D };

export function pointAsMbr(p: Point2D): MBR {
  return { p0: [p[0], p[1]], p1: [p[0], p[1]] };
}

export function formatMbr({ p0: [x0, y0], p1: [x1, y1] }: MBR): string {
  return `(${x0}, ${y0}), (${x1}, ${y1})`;
}

export function extendMbr(mbr0: MBR, mbr1: MBR): MBR {
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = mbr0;
  const {
    p0: [ep0x, ep0y],
    p1: [ep1x, ep1y],
  } = mbr1;
  const p0x = Math.min(np0x, ep0x);
  const p0y = Math.min(np0y, ep0y);
  const p1x = Math.max(np1x, ep1x);
  const p1y = Math.max(np1y, ep1y);
  return {
    p0: [p0x, p0y],
    p1: [p1x, p1y],
  };
}

export function extendMbrPlan<T extends DataNode>(
  node: InternalEntry<T>,
  entryMbr: MBR,
) {
  const extendedMbr = extendMbr(node.mbr, entryMbr);
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = node.mbr;
  const {
    p0: [p0x, p0y],
    p1: [p1x, p1y],
  } = extendedMbr;
  const originalArea = (np1x - np0x) * (np1y - np0y);
  const extendedArea = (p1x - p0x) * (p1y - p0y);
  const cost = extendedArea - originalArea;
  return {
    node,
    extendedMbr,
    extendedArea,
    originalArea,
    cost,
  };
}

export function canCoverMbr(nodeMbr: MBR, entryMbr: MBR) {
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = nodeMbr;
  const {
    p0: [ep0x, ep0y],
    p1: [ep1x, ep1y],
  } = entryMbr;
  return (
    np0x <= ep0x &&
    ep0x <= np1x &&
    np0x <= ep1x &&
    ep1x <= np1x &&
    np0y <= ep0y &&
    ep0y <= np1y &&
    np0y <= ep1y &&
    ep1y <= np1y
  );
}

export function mergeMbrs(mbrs: MBR[]): MBR | null {
  if (!mbrs.length) return null;
  return mbrs.reduce(extendMbr);
}

export function batchAddToNode<T extends DataNode>(
  addToNode: InternalEntry<T>,
  entries: (InternalEntry<T> | T)[],
  startIdx: number,
  endIdx: number,
) {
  for (let i = startIdx; i < endIdx; i += 1) {
    const entryToAdd = entries[i];
    if (addToNode.type === 'rtree-type-node-internal') {
      addToNode.entries.push(entryToAdd as InternalEntry<T>);
    } else {
      addToNode.entries.push(entryToAdd as T);
    }
    entryToAdd.parent = addToNode;
    const extended = extendMbrPlan(addToNode, entryToAdd.mbr);
    addToNode.mbr = extended.extendedMbr;
  }
}

export function minDist(
  [px, py]: Point2D,
  { p0: [sx, sy], p1: [tx, ty] }: MBR,
) {
  let rx = px;
  if (rx < sx) rx = sx;
  else if (rx > tx) rx = tx;
  let ry = py;
  if (ry < sy) ry = sy;
  else if (ry > ty) ry = ty;
  return (px - rx) ** 2 + (py - ry) ** 2;
}

export function minMaxDist(
  [px, py]: Point2D,
  { p0: [sx, sy], p1: [tx, ty] }: MBR,
) {
  const mx = (sx + tx) / 2;
  const rmx = px <= mx ? sx : tx;
  const rMx = px >= mx ? sx : tx;
  const my = (sy + ty) / 2;
  const rmy = py <= my ? sy : ty;
  const rMy = py >= my ? sy : ty;
  const dx = (px - rmx) ** 2 + (py - rMy) ** 2;
  const dy = (py - rmy) ** 2 + (px - rMx) ** 2;
  return Math.min(dx, dy);
}
