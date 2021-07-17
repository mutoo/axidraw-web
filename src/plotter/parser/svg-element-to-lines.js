import svgPathToLines from './svg-path-to-lines';
import svgElementToPath from './svg-element-to-path';
import svgPointsToLines from './svg-points-to-lines';

export default function* svgElementToLines(svgEl, opt) {
  switch (svgEl.nodeName) {
    case 'rect':
    case 'circle':
    case 'ellipse':
      // we are going to convert these shapes into PATH syntax
      // and them extract lines from path,
      // since the circles and ellipses are basically ARCs
      // and the rect(rounded) are just lines and arcs.
      yield* svgElementToPath(svgEl, opt);
      break;
    case 'line':
    case 'polyline':
    case 'polygon':
      // we can get PointsArray from these shapes,
      // and easily make lines from it.
      yield* svgPointsToLines(svgEl, opt);
      break;
    case 'path':
      // we would extract lines from this complex path,
      // that may make up of lines, beziers, and arcs.
      yield* svgPathToLines(svgEl, opt);
      break;
    default:
  }
}
