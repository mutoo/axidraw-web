export const dist = ([x0, y0], [x1, y1]) =>
  Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);

export const distSq = ([x0, y0], [x1, y1]) => (x0 - x1) ** 2 + (y0 - y1) ** 2;

export const isSamePoint = ([x0, y0], [x1, y1], epsilon = 0.0001) =>
  Math.abs(x0 - x1) < epsilon && Math.abs(y0 - y1) < epsilon;

export const pointToLineDist = ([px, py], [x0, y0], [x1, y1]) =>
  Math.abs(px * (y1 - y0) - py * (x1 - x0) + x1 * y0 - x0 * y1) /
  Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
