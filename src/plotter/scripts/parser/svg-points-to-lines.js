import { transformLine } from './svg-math.js';
import { getAttrVal } from './svg-utils.js';

// eslint-disable-next-line no-unused-vars
export default function* svgPointsToLines(svgEl, opt) {
  const ctm = svgEl.getCTM();
  switch (svgEl.nodeName) {
    case 'line': {
      const p0 = [getAttrVal(svgEl, 'x1'), getAttrVal(svgEl, 'y1')];
      const p1 = [getAttrVal(svgEl, 'x2'), getAttrVal(svgEl, 'y2')];
      yield transformLine(p0, p1, ctm);
      return;
    }
    case 'polyline':
    case 'polygon':
      {
        const { points } = svgEl;
        const len = points.length;
        for (let i = 0; i < len - 1; i += 1) {
          const p0 = points[i];
          const p1 = points[i + 1];
          yield transformLine(p0, p1, ctm);
        }
        if (svgEl.nodeName === 'polygon') {
          const p0 = points[len - 1];
          const p1 = points[0];
          yield transformLine(p0, p1, ctm);
        }
      }
      break;
    default:
  }
}
