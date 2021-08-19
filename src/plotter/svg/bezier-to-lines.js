// eslint-disable-next-line no-unused-vars
import {
  getMidPoint,
  isSufficientlyFlat,
  transformLine,
  transformPoint,
} from './math';
import { attachIds } from './utils';

export default function* bezierToLines(bezier, startPt, ctm, opt) {
  if (!bezier || bezier[0] !== 'C') {
    throw new Error(`invalid bezier: ${bezier}`);
  }
  // eslint-disable-next-line no-unused-vars
  const [_, ctrlPt1, ctrlPt2, endPt] = bezier;
  // A Primer on Bezier Curves
  // @link: https://pomax.github.io/bezierinfo/
  //
  // Piecewise Linear Approximation of Bezier Curves
  // @link: http://hcklbrrfnn.files.wordpress.com/2012/08/bez.pdf
  const { maxError } = opt;
  // translate maxError into path's local space
  const ctmInv = ctm.inverse();
  const ctmInvForVec = new DOMMatrix([
    ctmInv.a,
    ctmInv.b,
    ctmInv.c,
    ctmInv.d,
    0,
    0,
  ]);
  const [epx, epy] = transformPoint([maxError, 0], ctmInvForVec);
  const errSq = epx * epx + epy * epy;

  function* bezierLinearApproximation(p0, p1, p2, p3) {
    if (isSufficientlyFlat(p0, p1, p2, p3, errSq)) {
      yield attachIds(transformLine(p0, p3, ctm), opt);
    } else {
      // if it's not flat enough, then splits the bezier into two segments
      const lp1 = getMidPoint(p0, p1);
      const mp = getMidPoint(p1, p2);
      const lp2 = getMidPoint(lp1, mp);
      const rp2 = getMidPoint(p2, p3);
      const rp1 = getMidPoint(mp, rp2);
      const lp3 = getMidPoint(lp2, rp1);
      const rp0 = lp3;
      yield* bezierLinearApproximation(p0, lp1, lp2, lp3);
      yield* bezierLinearApproximation(rp0, rp1, rp2, p3);
    }
  }

  yield* bezierLinearApproximation(startPt, ctrlPt1, ctrlPt2, endPt);
  return endPt;
}
