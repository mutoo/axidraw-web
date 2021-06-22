import svgPathToLines from './svg-path-to-lines.js';
import svgElementToPath from './svg-element-to-path.js';

export default function* svgElementToLines(svgEl, opt) {
  switch (svgEl.type) {
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'line':
    case 'polyline':
    case 'polygon':
      yield* svgElementToPath(svgEl, opt);
      break;
    case 'path':
      yield* svgPathToLines(svgEl, opt);
      break;
    default:
  }
}
