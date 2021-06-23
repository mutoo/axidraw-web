import { transformLine } from './svg-math.js';

// eslint-disable-next-line no-unused-vars
export default function* svgPointsToLines(svgEl, opt) {
  const points = svgEl.array();
  const ctm = svgEl.node.getCTM();
  const len = points.length;
  for (let i = 0; i < len - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    yield transformLine(p0, p1, ctm);
  }
  if (svgEl.type === 'polygon') {
    const p0 = points[len - 1];
    const p1 = points[0];
    yield transformLine(p0, p1, ctm);
  }
}
