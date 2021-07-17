import svgElementToLines from './svg-element-to-lines';
import { mm2px } from '../../math/svg';

export const defaultSVGToLinesOptions = { maxError: mm2px(0.1) };

/**
 * Extract lines from svg container;
 * @param svg
 * @param opt
 * @returns {any}
 */
export default function* svgToLines(svg, opt = {}) {
  const mergedOptions = { ...defaultSVGToLinesOptions, ...opt };
  for (const svgEl of svg.children) {
    switch (svgEl.nodeName) {
      case 'svg':
      case 'g':
      case 'a':
        // these are container elements
        // we are going to extract lines from there children elements
        yield* svgToLines(svgEl, mergedOptions);
        break;
      case 'rect':
      case 'circle':
      case 'ellipse':
      case 'line':
      case 'polyline':
      case 'polygon':
      case 'path':
        // these are shape elements
        // we are going to extract lines from them directly or indirectly.
        yield* svgElementToLines(svgEl, mergedOptions);
        break;
      default:
        // unsupported types, e.g. DEF,
        // we just discard them
        console.debug(`unsupported type: ${svgEl.nodeName}`);
    }
  }
}
