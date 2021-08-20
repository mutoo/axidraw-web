import { mm2px } from 'math/svg';
import { logger } from '../utils';
import elementToPath from './element-to-path';
import pointsToLines from './points-to-lines';
import pathToLines from './path-to-lines';

/**
 * Extract lines from svg container;
 * @param svg
 * @param opt
 * @returns {any}
 */
export function* svgContainerToLines(svg, opt) {
  for (const svgEl of svg.children) {
    switch (svgEl.nodeName) {
      // container elements
      case 'svg':
      case 'g':
      case 'a':
        opt.groupId += 1;
        opt.groups.push(opt.groupId);
        // we are going to extract lines from there children elements
        yield* svgContainerToLines(svgEl, opt);
        opt.groups.pop();
        break;
      // elements that made with arcs and lines
      case 'rect':
      case 'circle':
      case 'ellipse':
        {
          // we are going to convert these shapes into PATH syntax
          // then extract lines from path.
          // since the circles and ellipses are basically ARCs
          // and the rect may have rounded corners make it composed by lines and arcs.
          const path = elementToPath(svgEl);
          if (path) {
            opt.elementId += 1;
            yield* pathToLines(path, opt);
          }
        }
        break;
      // elements that made with lines
      case 'line':
      case 'polyline':
      case 'polygon':
        // we can get points array from these shapes,
        // and easily generate lines from them.
        opt.elementId += 1;
        yield* pointsToLines(svgEl, opt);
        break;
      // the path element
      case 'path':
        // we would extract lines from this complex path,
        // that may make up of lines, beziers, and arcs.
        opt.elementId += 1;
        yield* pathToLines(svgEl, opt);
        break;
      default:
        // unsupported types, e.g. DEF,
        // we just discard them
        logger.info(`unsupported type: ${svgEl.nodeName}`);
    }
  }
}

export const defaultSVGToLinesOptions = { maxError: 0.1 };

export default function svgToLines(svg, opt) {
  const mergedOptions = { ...defaultSVGToLinesOptions, ...opt };
  mergedOptions.maxError = mm2px(mergedOptions.maxError);
  // initial these id from grouping lines
  mergedOptions.groupId = 0;
  mergedOptions.elementId = 0;
  mergedOptions.pathId = 0;
  mergedOptions.groups = [];
  return [...svgContainerToLines(svg, mergedOptions)];
}
