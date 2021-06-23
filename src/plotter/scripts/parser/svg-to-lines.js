import svgElementToLines from './svg-element-to-lines.js';

/**
 * Extract lines from svg container;
 * @param svg
 * @param opt
 * @returns {any}
 */
export default function* svgToLines(svg, opt) {
  for (const svgEl of svg.children()) {
    switch (svgEl.type) {
      // container elements
      case 'svg':
      case 'g':
      case 'a':
        yield* svgToLines(svgEl, opt);
        break;
      // shape elements
      case 'rect':
      case 'circle':
      case 'ellipse':
      case 'line':
      case 'polyline':
      case 'polygon':
      case 'path':
        yield* svgElementToLines(svgEl, opt);
        break;
      default:
      // discard
    }
  }
}
