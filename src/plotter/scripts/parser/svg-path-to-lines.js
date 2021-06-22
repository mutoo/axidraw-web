/* eslint-disable prefer-destructuring */
/* global SVG */

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

export default function* svgPathToLines(svgPath, opt) {
  const path = SVG(svgPath);
  if (!path.attr('d')) {
    return;
  }
  const pathArray = path.array();
  const ctm = svgPath.node.getCTM();
  let prevPos = [0, 0];
  let currPos;
  let startPos;
  for (const p of pathArray) {
    switch (p[0]) {
      case 'M':
        currPos = [p[1], p[2]];
        // set down the startPos for Z command
        if (!startPos) {
          startPos = currPos;
        }
        prevPos = currPos;
        break;
      case 'L':
        currPos = [p[1], p[2]];
        yield transformLine(prevPos, currPos, ctm);
        prevPos = currPos;
        break;
      case 'H':
      case 'V':
      case 'C':
      case 'S':
      case 'Q':
      case 'T':
        break;
      case 'A':
        {
          // B.2.4. Conversion from endpoint to center parameterization
          // @link: https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
          const { cos, sin, PI } = Math;
          const [x1, y1] = currPos;
          // eslint-disable-next-line no-unused-vars, prefer-const
          let [_, rx, ry, deg, fa, fs, x2, y2] = p;
          // B.2.5 step 1: ensure radii are non-zero
          if (rx === 0 || ry === 0) {
            currPos = [x2, y2];
            yield transformLine(prevPos, currPos, ctm);
            prevPos = currPos;
            // eslint-disable-next-line no-continue
            continue;
          }
          // B.2.5 step 2: ensure radii are positive
          rx = Math.abs(rx);
          ry = Math.abs(ry);
          // B.2.4 step 1: compute (x1t, y1t)
          const angle = (deg * Math.PI) / 180;
          const cosAngle = cos(angle);
          const sinAngle = sin(angle);
          const mat1 = new DOMMatrix([
            cosAngle,
            -sinAngle,
            sinAngle,
            cosAngle,
            0,
            0,
          ]);
          const p1t = transformPoint((x1 - x2) / 2, (y1 - y2) / 2, mat1);
          const x1t = p1t.x;
          const y1t = p1t.y;
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
          const mat3 = new DOMMatrix([
            cosAngle,
            sinAngle,
            -sinAngle,
            cosAngle,
            0,
            0,
          ]);
          const pc = transformPoint(cxt, cyt, mat3);
          const cx = pc.x + (x1 + x2) / 2;
          const cy = pc.y + (y1 + y2) / 2;
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
          let segments = 1;
          let error = Number.MAX_VALUE;
          let xe = x2;
          let ye = y2;
          do {
            const theta2 = theta1 + delta / segments;
            const thetaMid = (theta1 + theta2) / 2;
            const pm = transformPoint(
              rx * cos(thetaMid),
              ry * sin(thetaMid),
              mat3,
            );
            const xm = pm.x + cx;
            const ym = pm.y + cy;
            segments *= 2; // segments will be power of 2
            error = calculateArcError(x1, y1, xe, ye, xm, ym);
            xe = xm;
            ye = ym;
          } while (estError(error, maxError, ctm));
          const dt = delta / segments;
          for (let i = 1; i <= segments; i += 1) {
            prevPos = currPos;
            const theta = theta1 + dt * i;
            const pt = transformPoint(rx * cos(theta), ry * sin(theta), mat3);
            const xt = pt.x + cx;
            const yt = pt.y + cy;
            currPos = [xt, yt];
            yield transformLine(prevPos, currPos, ctm);
          }
        }
        break;
      case 'Z':
        break;
      default:
    }
  }
}
