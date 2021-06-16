import svgElementToLines from './svg-element-to-lines.js';

/**
 * Extract lines from svg container;
 * @param svg
 * @returns {any}
 */
export default function* svgToLines(svg) {
  for (const svgEl of svg.children()) {
    switch (svgEl.type) {
      case 'svg':
      case 'g':
      case 'a':
        yield* svgToLines(svgEl);
        break;
      case 'rect':
      case 'circle':
      case 'ellipse':
      case 'line':
      case 'polyline':
      case 'polygon':
      case 'path':
        yield* svgElementToLines(svgEl);
        break;
      default:
      // discard
    }
  }
}
