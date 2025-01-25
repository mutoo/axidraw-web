import { isSamePoint, Line2D, Point2D } from '../../math/geom';

export const toSvgLines = (lines: Line2D[]) =>
  lines
    .map(
      ([[x1, y1], [x2, y2]]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
    )
    .join('');

export const toSvgPathDef = (lines: Line2D[]) => {
  let currentPos: Point2D = [0, 0];
  return lines
    .reduce<string[]>(
      (defs, [[x0, y0], [x1, y1]]) => {
        if (isSamePoint([x0, y0], currentPos)) {
          defs.push(`${x1} ${y1}`);
        } else {
          defs.push(`M ${x0} ${y0} ${x1} ${y1}`);
        }
        currentPos = [x1, y1];
        return defs;
      },
      ['M 0 0'],
    )
    .join(' ');
};

export const toSvgPath = (lines: Line2D[]) =>
  `<path d="${toSvgPathDef(lines)}" />`;
