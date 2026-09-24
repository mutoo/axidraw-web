import { describe, expect, it } from 'vitest';
import type { Line2D, Point2D } from '@/math/geom';
import { reorderLineGroups } from '../planner';

const polyline = (points: Point2D[]): Line2D[] =>
  points.slice(1).map((p, i) => [points[i], p]);

describe('reorderLineGroups', () => {
  it('keeps closed shapes in the direction they were drawn', () => {
    // a closed path starts and ends at the same point, so both of its ends
    // are always equally near the pen
    const squares = Array.from({ length: 40 }, (_, i) => {
      const x = (i % 8) * 3;
      const y = Math.floor(i / 8) * 3;
      return polyline([
        [x, y],
        [x + 2, y],
        [x + 2, y + 2],
        [x, y + 2],
        [x, y],
      ]);
    });
    const reordered = reorderLineGroups(squares);
    expect(reordered).toHaveLength(squares.length);
    for (const square of reordered) {
      // each square was drawn starting along +x
      const [[x0, y0], [x1, y1]] = square[0];
      expect([x1 - x0, y1 - y0]).toEqual([2, 0]);
    }
  });

  it('draws equally near groups in document order', () => {
    // both groups start 5 away from the pen's home position
    const a = polyline([
      [0, 5],
      [0, 50],
    ]);
    const b = polyline([
      [5, 0],
      [50, 0],
    ]);
    expect(reorderLineGroups([a, b])).toEqual([a, b]);
    expect(reorderLineGroups([b, a])).toEqual([b, a]);
  });
});
