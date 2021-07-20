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
import { logger } from '../../utils';

export const pathCommands = {
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

const svgCommands = /[MLHVCSQTAZ]/gi;

export default function svgPathParser(pathDef = 'M 0 0', toAbsolute = true) {
  // firstly, we find all commands
  const segments = [...pathDef.matchAll(svgCommands)];
  // create a context to walk through the path
  const context = { x: 0, y: 0, startX: 0, startY: 0, toAbsolute };
  return segments.flatMap((segment, idx) => {
    const command = segment[0];
    // get the next command
    const maybeNextSegment = segments[idx + 1];
    // and extract params between these two commands
    const paramsStr = pathDef
      .substring(segment.index + 1, maybeNextSegment?.index)
      .trim();
    // get the command parser
    const cmdParser = pathCommands[command.toUpperCase()];
    if (!cmdParser) {
      logger.warn(`Invalid path command: ${command}`);
      return [];
    }
    // we assume all the parameters are float numbers
    const params = paramsStr?.split(/[\s,]/).map(parseFloat) || [];
    // each explicit command may had multiple subsequent as implicit command
    // so that we need to flat them after mapping
    return [...cmdParser.parse(command, params, context)];
  });
}
