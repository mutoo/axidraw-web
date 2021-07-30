/**
 * Fast transform point with DOMMatrix:
 *
 * The original DOMPoint.transformMatrix(DOMMatrix) is very slow.
 *
 * DOMMatrix * 2D Point
 *
 * | m11 m21 m31 m41 | <-> |   a   c m31   e | * | x |
 * | m12 m22 m32 m42 |     |   b   d m32   f |   | y |
 * | m13 m23 m33 m43 |     | m13 m23 m33 m43 |   | 0 |
 * | m14 m24 m34 m44 |     | m14 m24 m34 m44 |   | 1 |
 */
export const transformPoint = ([x, y], { a, b, c, d, e, f }) => {
  return [a * x + c * y + e, b * x + d * y + f];
};

export const transformLine = (p0, p1, ctm) => {
  const [x0, y0] = transformPoint(p0, ctm);
  const [x1, y1] = transformPoint(p1, ctm);
  return [x0, y0, x1, y1];
};

export const calculateArcError = (x1, y1, xm, ym, x2, y2) =>
  Math.abs(xm * (y2 - y1) - ym * (x2 - x1) + x2 * y1 - x1 * y2) /
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const angleFn = (ux, uy, vx, vy) =>
  Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);

export const isSufficientlyFlat = (x0, y0, x1, y1, x2, y2, x3, y3, errSq) => {
  let ux = (3 * x1 - 2 * x0 - x3) ** 2;
  let uy = (3 * y1 - 2 * y0 - y3) ** 2;
  const vx = (3 * x2 - 2 * x3 - x0) ** 2;
  const vy = (3 * y2 - 2 * y3 - y0) ** 2;
  if (ux < vx) ux = vx;
  if (uy < vy) uy = vy;
  return ux + uy <= 16 * errSq;
};

export const getMidPoint = (x0, y0, x1, y1) => [(x0 + x1) / 2, (y0 + y1) / 2];

// convert quadratic to cubic bezier
// https://codepen.io/enxaneta/post/quadratic-to-cubic-b-zier-in-svg
export const quadToCubicBezierControlPoints = (
  [x0, y0],
  [x1, y1],
  [x2, y2],
) => {
  const cx1 = x0 + ((x1 - x0) * 2) / 3;
  const cy1 = y0 + ((y1 - y0) * 2) / 3;
  const cx2 = x2 + ((x1 - x2) * 2) / 3;
  const cy2 = y2 + ((y1 - y2) * 2) / 3;
  return [
    [cx1, cy1],
    [cx2, cy2],
  ];
};
