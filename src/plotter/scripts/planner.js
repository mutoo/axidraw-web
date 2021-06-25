import svgToLines from './parser/svg-to-lines.js';
import { mm2px } from '../../math/svg.js';

export default function plan(svg, opt = { maxError: mm2px(0.1) }) {
  return [...svgToLines(svg, opt)];
}
