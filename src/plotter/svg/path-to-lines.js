import arcToLines from './arc-to-lines';
import bezierToLines from './bezier-to-lines';
import { quadToCubicBezierControlPoints, transformLine } from './math';
import svgPathParser from './path';
import { attachIds } from './utils';

export default function* pathToLines(svgPath, opt) {
  const pathDef = svgPath.getAttribute('d');
  if (!pathDef) {
    // discard path element with no path definition
    return;
  }

  // the CTM(current transformation matrix) is a matrix that transform this
  // element from its local space to svg world space
  const ctm = svgPath.getCTM();
  let prevPos = [0, 0];
  let currPos;
  let startPos; // store the start position of last Move command
  let prevBezier; // store prev control points for connected beziers
  for (const cmd of svgPathParser(pathDef)) {
    switch (cmd[0]) {
      // move command
      case 'M':
        prevPos = cmd[1];
        // also set down the startPos for Z command to return back
        startPos = prevPos;
        break;
      // line command
      case 'L':
        currPos = cmd[1];
        yield attachIds(transformLine(prevPos, currPos, ctm), opt);
        prevPos = currPos;
        break;
      // horizontal line command
      case 'H':
        currPos = [cmd[1], prevPos[1]];
        yield attachIds(transformLine(prevPos, currPos, ctm), opt);
        prevPos = currPos;
        break;
      // vertical line command
      case 'V':
        currPos = [prevPos[0], cmd[1]];
        yield attachIds(transformLine(prevPos, currPos, ctm), opt);
        prevPos = currPos;
        break;
      // quadratic bezier command
      case 'Q':
        {
          const controlPoints = quadToCubicBezierControlPoints(
            prevPos,
            cmd[1],
            cmd[2],
          );
          const bezier = ['C', ...controlPoints, cmd[2]];
          prevPos = yield* bezierToLines(bezier, prevPos, ctm, opt);
          prevBezier = cmd;
        }
        break;
      // simple quadratic bezier command
      case 'T':
        {
          if (!prevBezier || (prevBezier[0] !== 'Q' && prevBezier[0] !== 'T')) {
            throw new Error(`invalid T command can only follow by Q or T.`);
          }
          const cx1 = 2 * prevPos[0] - prevBezier[1][0];
          const cy1 = 2 * prevPos[1] - prevBezier[1][1];
          const controlPoints = quadToCubicBezierControlPoints(
            prevPos,
            [cx1, cy1],
            cmd[1],
          );
          const bezier = ['C', ...controlPoints, cmd[1]];
          prevPos = yield* bezierToLines(bezier, prevPos, ctm, opt);
          // convert to Q so that the (cx1, cy1) can be pass to next command
          prevBezier = ['Q', [cx1, cy1], cmd[1]];
        }
        break;
      case 'C':
        {
          const bezier = cmd;
          prevPos = yield* bezierToLines(bezier, prevPos, ctm, opt);
          prevBezier = bezier;
        }
        break;
      case 'S':
        {
          if (!prevBezier) {
            throw new Error(`invalid S command: ${cmd}`);
          }
          let pcx2;
          let pcy2;
          switch (prevBezier[0]) {
            case 'C':
              [pcx2, pcy2] = prevBezier[2];
              break;
            case 'S':
              [pcx2, pcy2] = prevBezier[1];
              break;
            default:
              throw new Error(`invalid S command can only follow by C or S.`);
          }
          const cx1 = 2 * prevPos[0] - pcx2;
          const cy1 = 2 * prevPos[1] - pcy2;
          const bezier = ['C', [cx1, cy1], cmd[1], cmd[2]];
          prevPos = yield* bezierToLines(bezier, prevPos, ctm, opt);
          prevBezier = cmd;
        }
        break;
      case 'A':
        prevPos = yield* arcToLines(cmd, prevPos, ctm, opt);
        break;
      case 'Z':
        if (startPos) {
          yield attachIds(transformLine(prevPos, startPos, ctm), opt);
          prevPos = startPos;
        }
        break;
      default:
    }
  }
}
