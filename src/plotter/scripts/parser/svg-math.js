// create only one point to save memory allocation
const thePoint = new DOMPoint();

export const transformPoint = (x, y, ctm) => {
  thePoint.x = x;
  thePoint.y = y;
  return thePoint.matrixTransform(ctm);
};

export const transformLine = (p0, p1, ctm) => {
  const p0t = transformPoint(p0[0], p0[1], ctm);
  const x0 = p0t.x;
  const y0 = p0t.y;
  const p1t = transformPoint(p1[0], p1[1], ctm);
  const x1 = p1t.x;
  const y1 = p1t.y;
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
export const quadToCubicBezierControlPoints = (x0, y0, x1, y1, x2, y2) => {
  const cx1 = x0 + ((x1 - x0) * 2) / 3;
  const cy1 = y0 + ((y1 - y0) * 2) / 3;
  const cx2 = x2 + ((x1 - x2) * 2) / 3;
  const cy2 = y2 + ((y1 - y2) * 2) / 3;
  return [cx1, cy1, cx2, cy2];
};
