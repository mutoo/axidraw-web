import M from './cmd-m';
import L from './cmd-l';
import H from './cmd-h';
import V from './cmd-v';
import C from './cmd-c';
import S from './cmd-s';
import Q from './cmd-q';
import T from './cmd-t';
import A from './cmd-a';
import Z from './cmd-z';
import { parsePath } from './parser';

export const pathInterpreters = {
  M,
  L,
  H,
  V,
  C,
  S,
  Q,
  T,
  A,
  Z,
};

export default function* svgPathParser(pathDef = 'M 0 0', toAbsolute = true) {
  // create a context to walk through the path
  const context = { x: 0, y: 0, startX: 0, startY: 0, toAbsolute };
  for (const command of parsePath(pathDef)) {
    const interpreter = pathInterpreters[command[0].toUpperCase()];
    yield* interpreter.execute(command, context);
  }
}
