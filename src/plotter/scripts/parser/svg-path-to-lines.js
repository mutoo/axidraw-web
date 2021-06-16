/* eslint-disable prefer-destructuring */
/* global SVG */

// create only one point to save memory allocation
const thePoint = new DOMPoint();

export const transformLine = (p0, p1, ctm) => {
  thePoint.x = p0[0];
  thePoint.y = p0[1];
  thePoint.matrixTransform(ctm);
  const x0 = thePoint.x;
  const y0 = thePoint.y;
  thePoint.x = p1[0];
  thePoint.y = p1[1];
  thePoint.matrixTransform(ctm);
  const x1 = thePoint.x;
  const y1 = thePoint.y;
  return [x0, y0, x1, y1];
};

export const angleFn = (ux, uy, vx, vy) =>
  Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);

export default function* svgPathToLines(svgPath) {
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
          // eslint-disable-next-line no-unused-vars
          const [_, rx, ry, angle, fa, fs, x2, y2] = p;
          // step 1: compute (x1t, y1t)
          thePoint.x = (x1 - x2) / 2;
          thePoint.y = (y1 - y2) / 2;
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
          thePoint.matrixTransform(mat1);
          const x1t = thePoint.x;
          const y1t = thePoint.y;
          // step 2: compute (cxt, cyt)
          const rx2 = rx * rx;
          const ry2 = ry * ry;
          const x1t2 = x1t * x1t;
          const y1t2 = y1t * y1t;
          const factor =
            (rx2 * ry2 - rx2 * y1t2 - ry2 * x1t2) / (rx2 * y1t2 + ry2 * x1t2);
          if (factor < 0) {
            // TODO: discard this path;
            throw new Error('bad Arc');
          }
          const sign = fa === fs ? -1 : 1;
          const root = Math.sqrt(factor);
          const cxt = (sign * root * rx * y1t) / ry;
          const cyt = (-sign * root * ry * x1t) / rx;
          // step 3: compute (cx, cy) from (cxt, cyt)
          thePoint.x = cxt;
          thePoint.y = cyt;
          const mat3 = new DOMMatrix([
            cosAngle,
            sinAngle,
            -sinAngle,
            cosAngle,
            0,
            0,
          ]);
          thePoint.matrixTransform(mat3);
          const cx = thePoint.x + (x1 + x2) / 2;
          const cy = thePoint.y + (y1 + y2) / 2;
          // step 4: compute theta1 and delta
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
          const theta2 = theta1 + delta;
          const dt = delta / 20;
          for (let t = theta1 + dt; Math.abs(theta2 - t) >= 0.0001; t += dt) {
            thePoint.x = rx * cos(t);
            thePoint.y = rx * sin(t);
            thePoint.matrixTransform(mat3);
            const x = thePoint.x + cx;
            const y = thePoint.y + cy;
            currPos = [x, y];
            yield transformLine(currPos, prevPos, ctm);
            prevPos = currPos;
          }
        }
        break;
      case 'Z':
        break;
      default:
    }
  }
}
