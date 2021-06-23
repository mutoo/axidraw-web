import svgPathToLines from './svg-path-to-lines.js';

export default function* svgElementToPath(svgEl, opt) {
  const svgPath = null;
  switch (svgEl.type) {
    case 'rect':
    case 'circle':
    case 'ellipse':
      break;
    default:
    // discard
  }
  yield* svgPathToLines(svgPath, opt);
}
