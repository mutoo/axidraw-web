import svgToLines from './parser/svg-to-lines.js';

export default function plan(svg) {
  const lines = [];
  for (const line of svgToLines(svg)) {
    lines.push(line);
    // TODO
    // eslint-disable-next-line no-debugger
    debugger;
  }
  return lines;
}
