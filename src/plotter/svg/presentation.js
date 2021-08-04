export const toSvgLines = (lines) =>
  lines
    .map((l) => `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}"/>`)
    .join('');

export const toSvgPathDef = (lines) => {
  const context = { x: 0, y: 0 };
  if (!lines) return 'M 0 0';
  const toFixed = (n) => n.toFixed(3);
  return lines
    .reduce((defs, line) => {
      if (line[0] === context.x && line[1] === context.y) {
        defs.push(`${toFixed(line[2])} ${toFixed(line[3])}`);
      } else {
        defs.push(
          `M ${toFixed(line[0])} ${toFixed(line[1])} ${toFixed(
            line[2],
          )} ${toFixed(line[3])}`,
        );
      }
      context.x = line[2];
      context.y = line[3];
      return defs;
    }, [])
    .join(' ');
};

export const toSvgPath = (lines) => `<path d="${toSvgPathDef(lines)}" />`;
