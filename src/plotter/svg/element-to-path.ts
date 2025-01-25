import { Path } from './path/parser';
import { getAttrVal } from './utils';

export default function elementToPath(
  svgEl: SVGRectElement | SVGCircleElement | SVGEllipseElement,
): Path {
  // we parse this manually to save time
  const parsedPath: Path = [];
  switch (svgEl.nodeName) {
    case 'rect':
      {
        const rectEl = svgEl as SVGRectElement;
        let w = getAttrVal(rectEl, 'width');
        let h = getAttrVal(rectEl, 'height');
        const x = getAttrVal(rectEl, 'x');
        const y = getAttrVal(rectEl, 'y');
        let rx = getAttrVal(rectEl, 'rx');
        let ry = getAttrVal(rectEl, 'ry');
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
        const roundEl = svgEl as SVGCircleElement | SVGEllipseElement;
        const cx = getAttrVal(roundEl, 'cx');
        const cy = getAttrVal(roundEl, 'cy');
        let rx: number, ry: number;
        if (svgEl.nodeName === 'circle') {
          const r = getAttrVal(roundEl as SVGCircleElement, 'r');
          rx = ry = r;
        } else {
          rx = getAttrVal(roundEl as SVGEllipseElement, 'rx');
          ry = getAttrVal(roundEl as SVGEllipseElement, 'ry');
        }
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
  return parsedPath;
}
