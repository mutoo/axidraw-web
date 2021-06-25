import svgPathToLines from './svg-path-to-lines.js';
import { createSVGElement, getAttrVal } from './svg-utils.js';

export default function* svgElementToPath(svgEl, opt) {
  let pathDef = '';
  switch (svgEl.nodeName) {
    case 'rect':
      {
        let w = getAttrVal(svgEl, 'width');
        let h = getAttrVal(svgEl, 'height');
        const x = getAttrVal(svgEl, 'x');
        const y = getAttrVal(svgEl, 'y');
        let rx = getAttrVal(svgEl, 'rx');
        let ry = getAttrVal(svgEl, 'ry');
        rx = Math.min(rx, w / 2);
        ry = Math.min(ry, h / 2);
        if (rx === 0 || ry === 0) {
          // we goes the rect counter-clock-wise
          pathDef += `M${x} ${y} v${w} h${h} v${-w} h${-h}`;
        } else {
          // it's a rounded rect
          w -= 2 * rx;
          h -= 2 * ry;
          // rotation = 0
          // large-arc = 0
          // sweep = 0
          pathDef +=
            // start point
            `M${x} ${y + ry}` +
            // left border
            `v${h} ` +
            // bottom left radius
            `a${rx} ${ry} 0 0 0 ${rx} ${ry} ` +
            // bottom border
            `h${w} ` +
            // bottom right radius
            `a${rx} ${ry} 0 0 0 ${rx} ${-ry} ` +
            // right border
            `v${-w} ` +
            // top right radius
            `a${rx} ${ry} 0 0 0 ${-rx} ${-ry} ` +
            // top border
            `h${-w}` +
            // top left radius
            `a${rx} ${ry} 0 0 0 ${-rx} ${ry} `;
        }
      }
      break;
    case 'circle':
    case 'ellipse':
      {
        const cx = getAttrVal(svgEl, 'cx');
        const cy = getAttrVal(svgEl, 'cy');
        const r = getAttrVal(svgEl, 'r');
        const rx = getAttrVal(svgEl, 'rx') ?? r;
        const ry = getAttrVal(svgEl, 'ry') ?? r;
        if (rx === 0 || ry === 0) {
          // arc with no radius
          // discard
          return;
        }
        pathDef +=
          // start point
          `M${cx} ${cy - ry}` +
          // rotation = 0
          // large-arc = 1
          // sweep = 0
          `a${rx} ${ry} 0 0 0 0 ${ry * 2}` +
          // we split a circle/ellipse into two arc
          // to ensure the linear approximation is working correctly
          `a${rx} ${ry} 0 0 0 0 ${-ry * 2}`;
      }
      break;
    default:
    // discard
  }
  const path = createSVGElement('path');
  path.setAttribute('d', pathDef);
  // proxy the ctm to current svg element;
  path.getCTM = () => svgEl.getCTM();
  yield* svgPathToLines(path, opt);
}
