import { Point2D, pointToLineDist } from '@/math/geom';
import { arcAngleFn, transformLine, transformPoint } from './math';
import { EllipticalArc } from './path/parser';
import { SvgToLinesOptions } from './svg-to-lines';
import { attachIds, Line2DWithId } from './utils';

export default function* arcToLines(
  arc: EllipticalArc[1],
  startPos: Point2D,
  ctm: DOMMatrix,
  opt: SvgToLinesOptions,
): Generator<Line2DWithId, Point2D, void> {
  // B.2.4. Conversion from endpoint to center parameterization
  // @link: https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
  const { cos, sin, PI } = Math;
  const [x1, y1] = startPos;
  const [rx, ry, deg, fa, fs, [x2, y2]] = arc;
  // B.2.5 step 1: ensure radii are non-zero
  if (rx === 0 || ry === 0) {
    const currPos = [x2, y2] as Point2D;
    yield attachIds(transformLine(startPos, currPos, ctm), opt);
    return currPos;
  }
  // B.2.5 step 2: ensure radii are positive
  let Rx = Math.abs(rx);
  let Ry = Math.abs(ry);
  // B.2.4 step 1: compute (x1t, y1t)
  const angle = (deg * Math.PI) / 180;
  const cosAngle = cos(angle);
  const sinAngle = sin(angle);
  const mat1 = new DOMMatrix([cosAngle, -sinAngle, sinAngle, cosAngle, 0, 0]);
  const [x1t, y1t] = transformPoint([(x1 - x2) / 2, (y1 - y2) / 2], mat1);
  // B.2.4 step 2: compute (cxt, cyt)
  let rx2 = Rx * Rx;
  let ry2 = Ry * Ry;
  const x1t2 = x1t * x1t;
  const y1t2 = y1t * y1t;
  // B.2.5 step 3: ensure radii are large enough
  const lambda = x1t2 / rx2 + y1t2 / ry2;
  if (lambda > 1) {
    const lambdaSqrt = Math.sqrt(lambda);
    Rx *= lambdaSqrt;
    Ry *= lambdaSqrt;
    rx2 = Rx * Rx;
    ry2 = Ry * Ry;
  }
  let factor =
    (rx2 * ry2 - rx2 * y1t2 - ry2 * x1t2) / (rx2 * y1t2 + ry2 * x1t2);
  if (factor < 0) {
    factor = 0;
  }
  const sign = fa === fs ? -1 : 1;
  const root = Math.sqrt(factor);
  const cxt = (sign * root * Rx * y1t) / Ry;
  const cyt = (-sign * root * Ry * x1t) / Rx;
  // B.2.4 step 3: compute (cx, cy) from (cxt, cyt)
  const mat3 = new DOMMatrix([cosAngle, sinAngle, -sinAngle, cosAngle, 0, 0]);
  const [pcx, pcy] = transformPoint([cxt, cyt], mat3);
  const cx = pcx + (x1 + x2) / 2;
  const cy = pcy + (y1 + y2) / 2;
  // B.2.4 step 4: compute theta1 and delta
  const vx1 = (x1t - cxt) / Rx;
  const vy1 = (y1t - cyt) / Ry;
  const vx2 = (-x1t - cxt) / Rx;
  const vy2 = (-y1t - cyt) / Ry;
  const theta1 = arcAngleFn(1, 0, vx1, vy1);
  const TWO_PI = PI * 2;
  const tDelta = arcAngleFn(vx1, vy1, vx2, vy2) % TWO_PI;
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

  function* arcLinearApproximation(
    t0: number,
    t1: number,
    p0: Point2D,
    p1: Point2D,
  ): Generator<Line2DWithId, void, void> {
    const tm = (t0 + t1) / 2;
    const [cpx, cpy] = transformPoint([Rx * cos(tm), Ry * sin(tm)], mat3);
    const pm = [cx + cpx, cy + cpy] as Point2D;
    const error = pointToLineDist(pm, p0, p1);
    // transform error to paper space and test with maxError
    const [ex, ey] = transformPoint([error, 0], matE);
    const errSq = ex * ex + ey * ey;
    if (errSq <= maxError * maxError) {
      yield attachIds(transformLine(p0, p1, ctm), opt);
    } else {
      // exceed the max error, splits the arc into two segments
      yield* arcLinearApproximation(t0, tm, p0, pm);
      yield* arcLinearApproximation(tm, t1, pm, p1);
    }
  }

  yield* arcLinearApproximation(theta1, theta1 + delta, [x1, y1], [x2, y2]);
  return [x2, y2];
}
