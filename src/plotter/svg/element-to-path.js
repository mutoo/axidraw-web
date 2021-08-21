import { getAttrVal } from './utils';

export default function elementToPath(svgEl) {
  // we parse this manually to save time
  const parsedPath = [];
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
          /* it's a normal rectangle */
          // we goes the rect counter-clock-wise
          //  1-(-w)-4
          //  |      |
          //  h     -h
          //  |      |
          //  2-( w)-3
          parsedPath.push(
            ['M', [x, y]],
            ['v', h],
            ['h', w],
            ['v', -h],
            ['h', -w],
          );
        } else {
          /* it's a rounded rectangle */
          w -= 2 * rx;
          h -= 2 * ry;
          // rotation = 0
          // large-arc = 0
          // sweep = 0
          parsedPath.push(
            // start point
            ['M', [x, y + ry]],
            // left border
            ['v', h],
            // bottom left radius
            ['a', [rx, ry, 0, 0, 0, [rx, ry]]],
            // bottom border
            ['h', w],
            // bottom right radius
            ['a', [rx, ry, 0, 0, 0, [rx, -ry]]],
            // right border
            ['v', -h],
            // top right radius
            ['a', [rx, ry, 0, 0, 0, [-rx, -ry]]],
            // top border
            ['h', -w],
            // top left radius
            ['a', [rx, ry, 0, 0, 0, [-rx, ry]]],
          );
        }
      }
      break;
    case 'circle':
    case 'ellipse':
      {
        const cx = getAttrVal(svgEl, 'cx');
        const cy = getAttrVal(svgEl, 'cy');
        const r = getAttrVal(svgEl, 'r');
        const rx = svgEl.nodeName === 'circle' ? r : getAttrVal(svgEl, 'rx');
        const ry = svgEl.nodeName === 'circle' ? r : getAttrVal(svgEl, 'ry');
        if (rx === 0 || ry === 0) {
          // it won't be drawn at all if circle or ellipse has no radius
          return null;
        }
        parsedPath.push(
          // start point
          ['M', [cx, cy - ry]],
          // rotation = 0
          // large-arc = 1
          // sweep = 0
          ['a', [rx, ry, 0, 0, 0, [0, ry * 2]]],
          // we split a circle/ellipse into two arc
          // to ensure the linear approximation is working correctly
          ['a', [rx, ry, 0, 0, 0, [0, -ry * 2]]],
        );
      }
      break;
    default:
      throw new Error(`Can't generate path definition from ${svgEl.nodeName}`);
  }

  // the new path element would not be inserted to the DOM, so it won't have
  // a calculated CTM(current transformation matrix).
  // we have to proxy the getCTM to current svg element, so that when generates
  // lines from this path, it would get a correct matrix.
  parsedPath.getCTM = () => svgEl.getCTM();
  parsedPath.parsed = true;
  return parsedPath;
}
