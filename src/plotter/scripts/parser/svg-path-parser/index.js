import M from './cmd-m.js';
import L from './cmd-l.js';
import H from './cmd-h.js';
import V from './cmd-v.js';
import Z from './cmd-z.js';

const svgCommands = /[MLHVCSQTAZ]/gi;

export const pathCommands = {
  M,
  L,
  H,
  V,
  Z,
};

export default function svgPathParser(pathDef = 'M 0 0', toAbsolute = true) {
  const segments = [...pathDef.matchAll(svgCommands)];
  const context = { x: 0, y: 0, startX: 0, startY: 0, toAbsolute };
  return segments.flatMap((segment, idx) => {
    const command = segment[0];
    const nextSegments = segments[idx + 1];
    const paramsStr = pathDef.substring(segment.index + 1, nextSegments?.index);
    const params = paramsStr.trim().split(/[\s,]/).map(parseFloat);
    const pathCmd = pathCommands[command.toUpperCase()];
    return pathCmd ? [...pathCmd.handle(command, params, context)] : [];
  });
}
