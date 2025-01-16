export type Point2D = [number, number];
export type Vector2D = Point2D;
export type Line2D = [Point2D, Point2D];

export const dist = ([x0, y0]: Point2D, [x1, y1]: Point2D) =>
  Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);

export const distSq = ([x0, y0]: Point2D, [x1, y1]: Point2D) =>
  (x0 - x1) ** 2 + (y0 - y1) ** 2;

export const isSamePoint = (
  [x0, y0]: Point2D,
  [x1, y1]: Point2D,
  epsilon = 0.0001,
) => Math.abs(x0 - x1) < epsilon && Math.abs(y0 - y1) < epsilon;

export const pointToLineDist = (
  [px, py]: Point2D,
  [x0, y0]: Point2D,
  [x1, y1]: Point2D,
) =>
  Math.abs(px * (y1 - y0) - py * (x1 - x0) + x1 * y0 - x0 * y1) /
  Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
