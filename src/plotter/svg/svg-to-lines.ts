import { mm2px } from '@/math/svg';
import { logger } from '../utils';
import elementToPath from './element-to-path';
import { svgPathParser } from './path';
import pathToLines from './path-to-lines';
import pointsToLines from './points-to-lines';
import { Line2DWithId } from './utils';

export type SVGContainer = SVGSVGElement | SVGGElement | SVGAElement;

/**
 * Extract lines from svg container;
 * @param svg
 * @param opt
 * @returns {any}
 */
export function* svgContainerToLines(
  svg: SVGContainer,
  opt: SvgToLinesOptions,
): Generator<Line2DWithId, void, void> {
  for (const child of svg.children) {
    const svgEl = child as SVGElement;
    switch (svgEl.nodeName) {
      // container elements
      case 'svg':
      case 'g':
      case 'a':
        opt.groupId += 1;
        opt.groups.push(opt.groupId);
        // we are going to extract lines from there children elements
        yield* svgContainerToLines(svgEl as SVGContainer, opt);
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
          const parsedPath = elementToPath(
            svgEl as SVGRectElement | SVGCircleElement | SVGEllipseElement,
          );
          // the new path element would not be inserted to the DOM, so it won't have
          // a calculated CTM(current transformation matrix).
          // we have to proxy the getCTM to current svg element, so that when generates
          // lines from this path, it would get a correct matrix.
          const ctm = (svgEl as SVGGraphicsElement).getCTM();
          if (!ctm) {
            throw new Error('Failed to get CTM');
          }
          opt.elementId += 1;
          yield* pathToLines(parsedPath, ctm, opt);
        }
        break;
      // elements that made with lines
      case 'line':
      case 'polyline':
      case 'polygon':
        // we can get points array from these shapes,
        // and easily generate lines from them.
        opt.elementId += 1;
        yield* pointsToLines(
          svgEl as SVGLineElement | SVGPolygonElement | SVGPolylineElement,
          opt,
        );
        break;
      // the path element
      case 'path':
        {
          // we would extract lines from this complex path,
          // that may make up of lines, beziers, and arcs.
          const pathEl = svgEl as SVGPathElement;
          const pathDescription = pathEl.getAttribute('d');
          if (pathDescription) {
            const path = svgPathParser(pathDescription);
            const ctm = (svgEl as SVGGraphicsElement).getCTM();
            if (!ctm) {
              throw new Error('Failed to get CTM');
            }
            opt.elementId += 1;
            yield* pathToLines(path, ctm, opt);
          }
        }
        break;
      default:
        // unsupported types, e.g. DEF,
        // we just discard them
        logger.info(`unsupported type: ${svgEl.nodeName}`);
    }
  }
}

export const defaultSVGToLinesOptions = { maxError: 0.1 };

export type SvgToLinesOptions = {
  maxError: number;
  groupId: number;
  elementId: number;
  pathId: number;
  groups: number[];
};

export default function svgToLines(
  svg: SVGContainer,
  opt: Partial<SvgToLinesOptions> = {},
): Line2DWithId[] {
  const mergedOptions: SvgToLinesOptions = {
    ...defaultSVGToLinesOptions,
    ...opt,
    // initial these id from grouping lines
    groupId: 0,
    elementId: 0,
    pathId: 0,
    groups: [],
  };
  mergedOptions.maxError = mm2px(mergedOptions.maxError);
  return [...svgContainerToLines(svg, mergedOptions)];
}
