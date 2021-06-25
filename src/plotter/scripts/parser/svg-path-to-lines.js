/* eslint-disable prefer-destructuring */
import svgArcToLines from './svg-arc-to-lines.js';
import svgBezierToLines from './svg-bezier-to-lines.js';
import { quadToCubicBezierControlPoints, transformLine } from './svg-math.js';
import svgPathParser from './svg-path-parser/index.js';

export default function* svgPathToLines(svgPath, opt) {
  const pathDef = svgPath.getAttribute('d');
  if (!pathDef) {
    return;
  }
  const pathArray = svgPathParser(pathDef);
  const ctm = svgPath.getCTM();
  let prevPos = [0, 0];
  let currPos;
  let startPos;
  let prevBezier;
  for (const p of pathArray) {
    switch (p[0]) {
      // move command
      case 'M':
        prevPos = [p[1], p[2]];
        // also set down the startPos for Z command
        startPos = prevPos;
        break;
      // line command
      case 'L':
        currPos = [p[1], p[2]];
        yield transformLine(prevPos, currPos, ctm);
        prevPos = currPos;
        break;
      // horizontal line command
      case 'H':
        currPos = [p[1], prevPos[1]];
        yield transformLine(prevPos, currPos, ctm);
        prevPos = currPos;
        break;
      // vertical line command
      case 'V':
        currPos = [prevPos[0], p[1]];
        yield transformLine(prevPos, currPos, ctm);
        prevPos = currPos;
        break;
      // quadratic bezier command
      case 'Q':
        {
          const controlPoints = quadToCubicBezierControlPoints(
            prevPos[0],
            prevPos[1],
            p[1],
            p[2],
            p[3],
            p[4],
          );
          const bezier = ['C', ...controlPoints, p[3], p[4]];
          prevPos = yield* svgBezierToLines(bezier, prevPos, ctm, opt);
          prevBezier = p;
        }
        break;
      // simple quadratic bezier command
      case 'T':
        {
          if (!prevBezier || (prevBezier[0] !== 'Q' && prevBezier[0] !== 'T')) {
            throw new Error(`invalid T command can only follow by Q or T.`);
          }
          const cx1 = 2 * prevPos[0] - prevBezier[1];
          const cy1 = 2 * prevPos[1] - prevBezier[2];
          const controlPoints = quadToCubicBezierControlPoints(
            prevPos[0],
            prevPos[1],
            cx1,
            cy1,
            p[1],
            p[2],
          );
          const bezier = ['C', ...controlPoints, p[1], p[2]];
          prevPos = yield* svgBezierToLines(bezier, prevPos, ctm, opt);
          // convert to Q so that the (cx1, cy1) can be pass to next command
          prevBezier = ['Q', cx1, cy1, p[1], p[2]];
        }
        break;
      case 'C':
        {
          const bezier = p;
          prevPos = yield* svgBezierToLines(bezier, prevPos, ctm, opt);
          prevBezier = bezier;
        }
        break;
      case 'S':
        {
          if (!prevBezier) {
            throw new Error(`invalid S command: ${p}`);
          }
          let pcx2;
          let pcy2;
          switch (prevBezier[0]) {
            case 'C':
              pcx2 = prevBezier[3];
              pcy2 = prevBezier[4];
              break;
            case 'S':
              pcx2 = prevBezier[1];
              pcy2 = prevBezier[2];
              break;
            default:
              throw new Error(`invalid S command can only follow by C or S.`);
          }
          const cx1 = 2 * prevPos[0] - pcx2;
          const cy1 = 2 * prevPos[1] - pcy2;
          const bezier = ['C', cx1, cy1, p[1], p[2], p[3], p[4]];
          prevPos = yield* svgBezierToLines(bezier, prevPos, ctm, opt);
          prevBezier = p;
        }
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
