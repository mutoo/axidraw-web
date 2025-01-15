import { Point2D } from '@/math/geom';
import arcToLines from './arc-to-lines';
import bezierToLines from './bezier-to-lines';
import { quadToCubicBezierControlPoints, transformLine } from './math';
import svgPathNormalizer from './path';
import {
  CurveTo,
  DrawToCommand,
  EllipticalArc,
  HorizontalLineTo,
  LineTo,
  MoveTo,
  Path,
  QuadBezierCurveTo,
  SmoothCurveTo,
  SmoothQuadBezierCurveTo,
  VerticalLineTo,
} from './path/parser';
import { SingleCommand } from './path/utils';
import { SvgToLinesOptions } from './svg-to-lines';
import { attachIds } from './utils';

export default function* pathToLines(
  path: Path,
  // the CTM(current transformation matrix) is a matrix that transform this
  // element from its local space to svg world space
  ctm: DOMMatrix,
  opt: SvgToLinesOptions,
) {
  let prevPos: Point2D = [0, 0];
  let currPos: Point2D = [0, 0];
  // store the start position of last Move command
  let startPos: Point2D | null = null;
  // store prev cmd, useful to get control points for connected beziers
  let prevCmd: SingleCommand<MoveTo | DrawToCommand> | null = null;
  for (const cmd of svgPathNormalizer(path)) {
    switch (cmd[0]) {
      // move command
      case 'M':
        prevPos = (cmd as SingleCommand<MoveTo>)[1];
        // also set down the startPos for Z command to return
        startPos = prevPos;
        break;
      // line command
      case 'L':
        currPos = (cmd as SingleCommand<LineTo>)[1];
        yield attachIds(transformLine(prevPos, currPos, ctm), opt);
        prevPos = currPos;
        break;
      // horizontal line command
      case 'H':
        currPos = [(cmd as SingleCommand<HorizontalLineTo>)[1], prevPos[1]];
        yield attachIds(transformLine(prevPos, currPos, ctm), opt);
        prevPos = currPos;
        break;
      // vertical line command
      case 'V':
        currPos = [prevPos[0], (cmd as SingleCommand<VerticalLineTo>)[1]];
        yield attachIds(transformLine(prevPos, currPos, ctm), opt);
        prevPos = currPos;
        break;
      // quadratic bezier command
      case 'Q':
        {
          const [_, [c1, c2]] = cmd as SingleCommand<QuadBezierCurveTo>;
          const controlPoints = quadToCubicBezierControlPoints(prevPos, c1, c2);
          const bezier: CurveTo[1] = [...controlPoints, c2];
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
            const cmdQ = prevCmd as SingleCommand<QuadBezierCurveTo>;
            cx1 = 2 * prevPos[0] - cmdQ[1][0][0];
            cy1 = 2 * prevPos[1] - cmdQ[1][0][1];
          }
          const cmdT = cmd as SingleCommand<SmoothQuadBezierCurveTo>;
          const controlPoints = quadToCubicBezierControlPoints(
            prevPos,
            [cx1, cy1],
            cmdT[1],
          );
          const bezier: CurveTo[1] = [...controlPoints, cmdT[1]];
          prevPos = yield* bezierToLines(bezier, prevPos, ctm, opt);
          // convert to Q so that the (cx1, cy1) can be pass to next command
          prevCmd = ['Q' as const, [[cx1, cy1], cmdT[1]]];
        }
        break;
      case 'C':
        prevPos = yield* bezierToLines((cmd as CurveTo)[1], prevPos, ctm, opt);
        break;
      case 'S':
        {
          let cx1: number;
          let cy1: number;
          if (!prevCmd || (prevCmd[0] !== 'C' && prevCmd[0] !== 'S')) {
            [cx1, cy1] = prevPos;
          } else {
            let pcx2: number;
            let pcy2: number;
            switch (prevCmd[0]) {
              case 'C':
                {
                  const comC = prevCmd as SingleCommand<CurveTo>;
                  [pcx2, pcy2] = comC[1][2];
                }
                break;
              case 'S':
                {
                  const comS = prevCmd as SingleCommand<SmoothCurveTo>;
                  [pcx2, pcy2] = comS[1][1];
                }
                break;
              default:
                throw new Error(
                  `invalid S command following by ${prevCmd[0] as string}.`,
                );
            }
            cx1 = 2 * prevPos[0] - pcx2;
            cy1 = 2 * prevPos[1] - pcy2;
          }

          const cmdS = cmd as SingleCommand<SmoothCurveTo>;
          const bezier: CurveTo[1] = [[cx1, cy1], cmdS[1][0], cmdS[1][1]];
          prevPos = yield* bezierToLines(bezier, prevPos, ctm, opt);
        }
        break;
      case 'A':
        prevPos = yield* arcToLines(
          (cmd as SingleCommand<EllipticalArc>)[1],
          prevPos,
          ctm,
          opt,
        );
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
