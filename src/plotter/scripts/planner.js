import svgToLines from './parser/svg-to-lines.js';

export default function plan(svg) {
  const lines = [];
  for (const line of svgToLines(svg)) {
    lines.push(line);
  }
  return lines;
}
