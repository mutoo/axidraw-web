import svgPathToLines from './svg-path-to-lines.js';

export default function* svgElementToPath(svgEl) {
  const svgPath = null;
  switch (svgEl.type) {
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'line':
    case 'polyline':
    case 'polygon':
      break;
    default:
    // discard
  }
  yield* svgPathToLines(svgPath);
}
