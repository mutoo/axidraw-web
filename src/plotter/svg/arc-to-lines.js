/* eslint-disable prefer-destructuring */
import {
  angleFn,
  calculateArcError,
  transformLine,
  transformPoint,
} from './math';

// eslint-disable-next-line consistent-return
export default function* arcToLines(arc, startPos, ctm, opt) {
  if (!arc || arc[0] !== 'A') {
    throw new Error(`invalid arc: ${arc}`);
  }
  // B.2.4. Conversion from endpoint to center parameterization
  // @link: https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
  const { cos, sin, PI } = Math;
  const [x1, y1] = startPos;
  // eslint-disable-next-line no-unused-vars, prefer-const
  let [_, rx, ry, deg, fa, fs, [x2, y2]] = arc;
  // B.2.5 step 1: ensure radii are non-zero
  if (rx === 0 || ry === 0) {
    const currPos = [x2, y2];
    yield transformLine(startPos, currPos, ctm);
    return currPos;
  }
  // B.2.5 step 2: ensure radii are positive
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  // B.2.4 step 1: compute (x1t, y1t)
  const angle = (deg * Math.PI) / 180;
  const cosAngle = cos(angle);
  const sinAngle = sin(angle);
  const mat1 = new DOMMatrix([cosAngle, -sinAngle, sinAngle, cosAngle, 0, 0]);
  const [x1t, y1t] = transformPoint([(x1 - x2) / 2, (y1 - y2) / 2], mat1);
  // B.2.4 step 2: compute (cxt, cyt)
  let rx2 = rx * rx;
  let ry2 = ry * ry;
  const x1t2 = x1t * x1t;
  const y1t2 = y1t * y1t;
  // B.2.5 step 3: ensure radii are large enough
  const lambda = x1t2 / rx2 + y1t2 / ry2;
  if (lambda > 1) {
    const lambdaSqrt = Math.sqrt(lambda);
    rx *= lambdaSqrt;
    ry *= lambdaSqrt;
    rx2 = rx * rx;
    ry2 = ry * ry;
  }
  let factor =
    (rx2 * ry2 - rx2 * y1t2 - ry2 * x1t2) / (rx2 * y1t2 + ry2 * x1t2);
  if (factor < 0) {
    factor = 0;
  }
  const sign = fa === fs ? -1 : 1;
  const root = Math.sqrt(factor);
  const cxt = (sign * root * rx * y1t) / ry;
  const cyt = (-sign * root * ry * x1t) / rx;
  // B.2.4 step 3: compute (cx, cy) from (cxt, cyt)
  const mat3 = new DOMMatrix([cosAngle, sinAngle, -sinAngle, cosAngle, 0, 0]);
  const [pcx, pcy] = transformPoint([cxt, cyt], mat3);
  const cx = pcx + (x1 + x2) / 2;
  const cy = pcy + (y1 + y2) / 2;
  // B.2.4 step 4: compute theta1 and delta
  const vx1 = (x1t - cxt) / rx;
  const vy1 = (y1t - cyt) / ry;
  const vx2 = (-x1t - cxt) / rx;
  const vy2 = (-y1t - cyt) / ry;
  const theta1 = angleFn(1, 0, vx1, vy1);
  const TWO_PI = PI * 2;
  const tDelta = angleFn(vx1, vy1, vx2, vy2) % TWO_PI;
  let delta = tDelta;
  if (fs === 0 && tDelta > 0) {
    delta -= TWO_PI;
  }
  if (fs === 1 && tDelta < 0) {
    delta += TWO_PI;
  }
  // linear approximation
  // https://www.spaceroots.org/documents/ellipse/elliptical-arc.pdf
  const { maxError } = opt;
  const matE = new DOMMatrix([ctm.a, ctm.b, ctm.c, ctm.d, 0, 0]);
  function* arcLinearApproximation(t1, t2, sx, sy, ex, ey) {
    const mt = (t1 + t2) / 2;
    const [mpx, mpy] = transformPoint([rx * cos(mt), ry * sin(mt)], mat3);
    const mx = mpx + cx;
    const my = mpy + cy;
    const error = calculateArcError(sx, sy, mx, my, ex, ey);
    // transform error to paper space and test with maxError
    const [epx, epy] = transformPoint([error, 0], matE);
    const errSq = epx * epx + epy * epy;
    if (errSq <= maxError * maxError) {
      yield transformLine([sx, sy], [ex, ey], ctm);
    } else {
      // exceed the max error, splits the arc into two segments
      yield* arcLinearApproximation(t1, mt, sx, sy, mx, my);
      yield* arcLinearApproximation(mt, t2, mx, my, ex, ey);
    }
  }
  yield* arcLinearApproximation(theta1, theta1 + delta, x1, y1, x2, y2);
  return [x2, y2];
}
