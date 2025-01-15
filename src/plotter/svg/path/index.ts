import A from './cmd-a';
import C from './cmd-c';
import H from './cmd-h';
import L from './cmd-l';
import M from './cmd-m';
import Q from './cmd-q';
import S from './cmd-s';
import T from './cmd-t';
import V from './cmd-v';
import Z from './cmd-z';
import {
  ClosePath,
  Command,
  CurveTo,
  EllipticalArc,
  HorizontalLineTo,
  LineTo,
  MoveTo,
  parsePath,
  Path,
  QuadBezierCurveTo,
  SmoothCurveTo,
  SmoothQuadBezierCurveTo,
  VerticalLineTo,
} from './parser';
import { Context, SingleCommand } from './utils';

export function svgPathParser(pathDef = 'M 0 0') {
  return parsePath(pathDef);
}

export default function* svgPathNormalizer(
  parsedPath: Path,
  toAbsolute = true,
): Generator<SingleCommand<Command>, void, void> {
  if (!parsedPath) {
    return;
  }

  // create a context to walk through the path
  const context: Context = { x: 0, y: 0, startX: 0, startY: 0, toAbsolute };
  for (const command of parsedPath) {
    const commandId = (command[0] as string).toUpperCase();
    switch (commandId) {
      case 'M':
        yield* M(command as MoveTo, context);
        break;
      case 'L':
        yield* L(command as LineTo, context);
        break;
      case 'H':
        yield* H(command as HorizontalLineTo, context);
        break;
      case 'V':
        yield* V(command as VerticalLineTo, context);
        break;
      case 'C':
        yield* C(command as CurveTo, context);
        break;
      case 'S':
        yield* S(command as SmoothCurveTo, context);
        break;
      case 'Q':
        yield* Q(command as QuadBezierCurveTo, context);
        break;
      case 'T':
        yield* T(command as SmoothQuadBezierCurveTo, context);
        break;
      case 'A':
        yield* A(command as EllipticalArc, context);
        break;
      case 'Z':
        yield* Z(command as ClosePath, context);
        break;
      default:
    }
  }
}
