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

export const calculateArcError = (x1, y1, x2, y2, xm, ym) =>
  Math.abs(xm * (y2 - y1) - ym * (x2 - x1) + x2 * y1 - x1 * y2) /
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const angleFn = (ux, uy, vx, vy) =>
  Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);

export const estError = (error, maxError, ctm) => {
  const mat = new DOMMatrix([ctm.a, ctm.b, ctm.c, ctm.d, 0, 0]);
  const p = transformPoint(error, 0, mat);
  const errSq = p.x * p.x + p.y * p.y;
  return errSq > maxError * maxError;
};
