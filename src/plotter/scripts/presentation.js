export const toSvgLines = (lines) =>
  lines
    .map((l) => `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}"/>`)
    .join('');

export const toSvgPath = (lines) =>
  `<Path d="${lines
    .map((l) => `M${l[0]} ${l[1]} L${l[2]} ${l[3]}`)
    .join(' ')}" />`;
