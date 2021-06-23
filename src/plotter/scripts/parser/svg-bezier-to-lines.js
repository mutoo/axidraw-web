// eslint-disable-next-line no-unused-vars
import {
  getMidPoint,
  isSufficientlyFlat,
  transformLine,
  transformPoint,
} from './svg-math.js';

export default function* svgBezierToLines(bezier, startPos, ctm, opt) {
  if (!bezier || bezier[0] !== 'C') {
    throw new Error(`invalid bezier: ${bezier}`);
  }
  const [x0, y0] = startPos;
  // eslint-disable-next-line no-unused-vars
  const [_, x1, y1, x2, y2, x3, y3] = bezier;
  // Useful resources:
  //
  // A Primer on Bezier Curves
  // @link: https://pomax.github.io/bezierinfo/
  //
  // Piecewise Linear Approximation of Bezier Curves
  // @link: http://hcklbrrfnn.files.wordpress.com/2012/08/bez.pdf
  const { maxError } = opt;
  // translate maxError into path space
  const ctmInv = ctm.inverse();
  const ctmInvForVec = new DOMMatrix([
    ctmInv.a,
    ctmInv.b,
    ctmInv.c,
    ctmInv.d,
    0,
    0,
  ]);
  const ep = transformPoint(maxError, 0, ctmInvForVec);
  const errSq = ep.x * ep.x + ep.y * ep.y;
  function* bezierLinearApproximation(sx, sy, cx1, cy1, cx2, cy2, ex, ey) {
    if (isSufficientlyFlat(sx, sy, cx1, cy1, cx2, cy2, ex, ey, errSq)) {
      yield transformLine([sx, sy], [ex, ey], ctm);
    } else {
      // not flat enough, splits the bezier into two segments
      const [lx0, ly0] = [sx, sy];
      const [rx3, ry3] = [ex, ey];
      const [lx1, ly1] = getMidPoint(lx0, ly0, cx1, cy1);
      const [mx, my] = getMidPoint(cx1, cy1, cx2, cy2);
      const [lx2, ly2] = getMidPoint(lx1, ly1, mx, my);
      const [rx2, ry2] = getMidPoint(cx2, cy2, rx3, ry3);
      const [rx1, ry1] = getMidPoint(mx, my, rx2, ry2);
      const [lx3, ly3] = getMidPoint(lx2, ly2, rx1, ry1);
      const [rx0, ry0] = [lx3, ly3];
      yield* bezierLinearApproximation(lx0, ly0, lx1, ly1, lx2, ly2, lx3, ly3);
      yield* bezierLinearApproximation(rx0, ry0, rx1, ry1, rx2, ry2, rx3, ry3);
    }
  }
  yield* bezierLinearApproximation(x0, y0, x1, y1, x2, y2, x3, y3);
  return [x3, y3];
}
