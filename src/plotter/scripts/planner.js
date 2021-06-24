import svgToLines from './parser/svg-to-lines.js';
import { mm2px } from '../../math/svg.js';

export default function plan(svg, opt = { maxError: mm2px(5) }) {
  const lines = [];
  for (const line of svgToLines(svg, opt)) {
    lines.push(line);
  }
  return lines;
}
