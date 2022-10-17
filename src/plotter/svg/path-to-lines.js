import arcToLines from './arc-to-lines';
import bezierToLines from './bezier-to-lines';
import { quadToCubicBezierControlPoints, transformLine } from './math';
import svgPathNormalizer, { svgPathParser } from './path';
import { attachIds } from './utils';

export default function* pathToLines(path, opt) {
  let parsedPath = null;
  if (path.parsed) {
    parsedPath = path;
  } else {
    const pathDef = path.getAttribute('d');
    if (!pathDef) {
      // discard path element with no path definition
      return;
    }
    parsedPath = svgPathParser(pathDef);
  }

  // the CTM(current transformation matrix) is a matrix that transform this
  // element from its local space to svg world space
  const ctm = path.getCTM();
  let prevPos = [0, 0];
  let currPos;
  let startPos; // store the start position of last Move command
  let prevCmd; // store prev cmd, useful to get control points for connected beziers
  for (const cmd of svgPathNormalizer(parsedPath)) {
    switch (cmd[0]) {
      // move command
      case 'M':
        prevPos = cmd[1];
        // also set down the startPos for Z command to return
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
        }
        break;
      // simple quadratic bezier command
      case 'T':
        {
          let cx1;
          let cy1;
          // the previous T was converted to Q in following code, so no need to
          // handle T command here
          if (!prevCmd || prevCmd[0] !== 'Q') {
            [cx1, cy1] = prevPos;
          } else {
            cx1 = 2 * prevPos[0] - prevCmd[1][0];
            cy1 = 2 * prevPos[1] - prevCmd[1][1];
          }
          const controlPoints = quadToCubicBezierControlPoints(
            prevPos,
            [cx1, cy1],
            cmd[1],
          );
          const bezier = ['C', ...controlPoints, cmd[1]];
          prevPos = yield* bezierToLines(bezier, prevPos, ctm, opt);
          // convert to Q so that the (cx1, cy1) can be pass to next command
          prevCmd = ['Q', [cx1, cy1], cmd[1]];
        }
        break;
      case 'C':
        prevPos = yield* bezierToLines(cmd, prevPos, ctm, opt);
        break;
      case 'S':
        {
          let cx1;
          let cy1;
          if (!prevCmd || (prevCmd[0] !== 'C' && prevCmd[0] !== 'S')) {
            [cx1, cy1] = prevPos;
          } else {
            let pcx2;
            let pcy2;
            switch (prevCmd[0]) {
              case 'C':
                [pcx2, pcy2] = prevCmd[2];
                break;
              case 'S':
                [pcx2, pcy2] = prevCmd[1];
                break;
              default:
                throw new Error(
                  `invalid S command following by ${prevCmd[0]}.`,
                );
            }
            cx1 = 2 * prevPos[0] - pcx2;
            cy1 = 2 * prevPos[1] - pcy2;
          }

          const bezier = ['C', [cx1, cy1], cmd[1], cmd[2]];
          prevPos = yield* bezierToLines(bezier, prevPos, ctm, opt);
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
    prevCmd = cmd;
  }
}
