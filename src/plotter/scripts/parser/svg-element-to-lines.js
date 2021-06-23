import svgPathToLines from './svg-path-to-lines.js';
import svgElementToPath from './svg-element-to-path.js';
import svgPointsToLines from './svg-points-to-lines.js';

export default function* svgElementToLines(svgEl, opt) {
  switch (svgEl.type) {
    case 'rect':
    case 'circle':
    case 'ellipse':
      yield* svgElementToPath(svgEl, opt);
      break;
    case 'line':
    case 'polyline':
    case 'polygon':
      yield* svgPointsToLines(svgEl, opt);
      break;
    case 'path':
      yield* svgPathToLines(svgEl, opt);
      break;
    default:
  }
}
