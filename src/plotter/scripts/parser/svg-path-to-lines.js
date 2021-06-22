/* eslint-disable prefer-destructuring */
/* global SVG */
import svgArcToLines from './svg-arc-to-lines.js';
import { transformLine } from './svg-math.js';

export default function* svgPathToLines(svgPath, opt) {
  const path = SVG(svgPath);
  if (!path.attr('d')) {
    return;
  }
  const pathArray = path.array();
  const ctm = svgPath.node.getCTM();
  let prevPos = [0, 0];
  let currPos;
  let startPos;
  for (const p of pathArray) {
    switch (p[0]) {
      case 'M':
        prevPos = [p[1], p[2]];
        // also set down the startPos for Z command
        startPos = prevPos;
        break;
      case 'L':
        currPos = [p[1], p[2]];
        yield transformLine(prevPos, currPos, ctm);
        prevPos = currPos;
        break;
      case 'H':
        currPos = [p[1], prevPos[1]];
        yield transformLine(prevPos, currPos, ctm);
        prevPos = currPos;
        break;
      case 'V':
        currPos = [prevPos[0], p[1]];
        yield transformLine(prevPos, currPos, ctm);
        prevPos = currPos;
        break;
      case 'S':
      case 'Q':
      case 'T':
      case 'C':
        break;
      case 'A':
        prevPos = yield* svgArcToLines(p, prevPos, ctm, opt);
        break;
      case 'Z':
        if (startPos) {
          yield transformLine(prevPos, startPos, ctm);
          prevPos = startPos;
        }
        break;
      default:
    }
  }
}
