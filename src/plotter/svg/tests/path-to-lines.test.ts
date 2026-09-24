import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Line2D, Point2D } from '@/math/geom';
import { svgPathParser } from '../path';
import pathToLines from '../path-to-lines';

// Node has no DOMMatrix; the SVG code only needs the 2D affine part.
class Matrix2D {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  constructor(init?: number[]) {
    if (init) [this.a, this.b, this.c, this.d, this.e, this.f] = init;
  }
  inverse() {
    const { a, b, c, d, e, f } = this;
    const det = a * d - b * c;
    return new Matrix2D([
      d / det,
      -b / det,
      -c / det,
      a / det,
      (c * f - d * e) / det,
      (b * e - a * f) / det,
    ]);
  }
}

const toLines = (d: string): Line2D[] => [
  ...pathToLines(svgPathParser(d), new Matrix2D() as unknown as DOMMatrix, {
    maxError: 0.01,
    groupId: 0,
    elementId: 0,
    pathId: 0,
    groups: [],
  }),
];

const cubicAt = (
  [p0, p1, p2, p3]: [Point2D, Point2D, Point2D, Point2D],
  t: number,
): Point2D => {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [
    w[0] * p0[0] + w[1] * p1[0] + w[2] * p2[0] + w[3] * p3[0],
    w[0] * p0[1] + w[1] * p1[1] + w[2] * p2[1] + w[3] * p3[1],
  ];
};

const quadAt = (
  [p0, p1, p2]: [Point2D, Point2D, Point2D],
  t: number,
): Point2D => {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
};

const distToLines = ([x, y]: Point2D, lines: Line2D[]) =>
  Math.min(
    ...lines.map(([[x0, y0], [x1, y1]]) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const lenSq = dx * dx + dy * dy;
      const t = lenSq
        ? Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / lenSq))
        : 0;
      return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
    }),
  );

// max distance from the ideal curve to the generated polyline
const maxDeviation = (curveAt: (t: number) => Point2D, lines: Line2D[]) => {
  let max = 0;
  for (let i = 0; i <= 50; i += 1) {
    max = Math.max(max, distToLines(curveAt(i / 50), lines));
  }
  return max;
};

describe('pathToLines smooth curve commands', () => {
  beforeAll(() => {
    vi.stubGlobal('DOMMatrix', Matrix2D);
  });

  it('reflects the second control point of C for a following S', () => {
    const lines = toLines('M 10 80 C 40 10 65 10 95 80 S 150 150 180 80');
    // (65,10) reflected around (95,80) is (125,150)
    const s: [Point2D, Point2D, Point2D, Point2D] = [
      [95, 80],
      [125, 150],
      [150, 150],
      [180, 80],
    ];
    expect(maxDeviation((t) => cubicAt(s, t), lines)).toBeLessThan(0.05);
  });

  it('reflects the second control point of S for a following S', () => {
    const lines = toLines(
      'M 10 80 C 40 10 65 10 95 80 S 150 150 180 80 S 235 10 265 80',
    );
    // (150,150) reflected around (180,80) is (210,10)
    const s: [Point2D, Point2D, Point2D, Point2D] = [
      [180, 80],
      [210, 10],
      [235, 10],
      [265, 80],
    ];
    expect(maxDeviation((t) => cubicAt(s, t), lines)).toBeLessThan(0.05);
  });

  it('keeps reflecting the control point across consecutive T', () => {
    const lines = toLines('M 10 80 Q 52.5 10 95 80 T 180 80 T 265 80');
    // Q control (52.5,10) -> T1 control (137.5,150) -> T2 control (222.5,10)
    const t1: [Point2D, Point2D, Point2D] = [
      [95, 80],
      [137.5, 150],
      [180, 80],
    ];
    const t2: [Point2D, Point2D, Point2D] = [
      [180, 80],
      [222.5, 10],
      [265, 80],
    ];
    expect(maxDeviation((t) => quadAt(t1, t), lines)).toBeLessThan(0.05);
    expect(maxDeviation((t) => quadAt(t2, t), lines)).toBeLessThan(0.05);
  });
});
