import { Point2D } from '@/math/geom';
import { transformLine } from './math';
import { SvgToLinesOptions } from './svg-to-lines';
import { attachIds, getAttrVal } from './utils';

export default function* pointsToLines(
  svgEl: SVGLineElement | SVGPolylineElement | SVGPolygonElement,
  opt: SvgToLinesOptions,
) {
  const ctm = svgEl.getCTM();
  if (!ctm) {
    throw new Error('CTM is null');
  }
  switch (svgEl.nodeName) {
    case 'line': {
      const svgLineEl = svgEl as SVGLineElement;
      const p0 = [
        getAttrVal(svgLineEl, 'x1'),
        getAttrVal(svgLineEl, 'y1'),
      ] as Point2D;
      const p1 = [
        getAttrVal(svgLineEl, 'x2'),
        getAttrVal(svgLineEl, 'y2'),
      ] as Point2D;
      yield attachIds(transformLine(p0, p1, ctm), opt);
      return;
    }
    case 'polyline':
    case 'polygon':
      {
        const { points } = svgEl as SVGPolylineElement | SVGPolygonElement;
        const len = points.length;
        for (let i = 0; i < len - 1; i += 1) {
          const p0 = points[i];
          const p1 = points[i + 1];
          yield attachIds(transformLine([p0.x, p0.y], [p1.x, p1.y], ctm), opt);
        }
        if (svgEl.nodeName === 'polygon') {
          const p0 = points[len - 1];
          const p1 = points[0];
          yield attachIds(transformLine([p0.x, p0.y], [p1.x, p1.y], ctm), opt);
        }
      }
      break;
    default:
  }
}
