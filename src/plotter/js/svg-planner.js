/* global SVG */

import { delay } from '../../utils/time.js';

export function* svgWalker(svgEl) {
  switch (svgEl.type) {
    case 'svg':
    case 'g':
    case 'a':
      for (const child of svgEl.children()) {
        yield* svgWalker(child);
      }
      break;
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'line':
    case 'polyline':
    case 'polygon':
    case 'path':
      yield svgEl;
      break;
    default:
      console.debug(`Unsupported element type: ${svgEl.type}`);
  }
}

export const flattenPath = (path, svgMatrix) => {
  const pathArray = path.array();
  const transform = (x, y) => {
    const p = new SVG.Point(x, y).transform(svgMatrix);
    return [p.x, p.y];
  };
  const transformedArray = pathArray.forEach((segment) => {
    switch (segment[0]) {
      case 'M':
      case 'L':
      case 'T':
        return [segment[0], ...transform(segment[1], segment[2])];
      case 'H':
        return [segment[0], ...transform(segment[1], 0)];
      case 'V':
        return [segment[0], ...transform(0, segment[1])];
      case 'S':
      case 'Q':
        return [
          segment[0],
          ...transform(segment[1], segment[2]),
          ...transform(segment[3], segment[4]),
        ];
      case 'C':
        return [
          segment[0],
          ...transform(segment[1], segment[2]),
          ...transform(segment[3], segment[4]),
          ...transform(segment[5], segment[6]),
        ];
      case 'A':
        return [
          segment[0],
          segment[1],
          segment[2],
          segment[3],
          segment[4],
          segment[5],
          ...transform(segment[6], segment[7]),
        ];
      default:
        return segment;
    }
  });
  return new SVG.Path().plot(transformedArray.toString());
};

export const flatten = async (source) => {
  let planning = SVG('#planning');
  if (planning) {
    planning.remove();
  }
  planning = new SVG.G().id('planning');
  const svg = SVG(source);
  let t0 = performance.now();
  for (const el of svgWalker(svg)) {
    const path = el.type !== 'path' ? el.toPath(false) : el.clone();
    // ignore empty path
    if (!path.attr('d')) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const ctm = el.node.getCTM();
    path.transform(ctm).attr('style', null).addTo(planning);
    // let browser to take a breath
    const t1 = performance.now();
    if (t1 - t0 >= 16) {
      // eslint-disable-next-line no-await-in-loop
      await delay(0);
      t0 = performance.now();
    }
  }
  planning.addTo('#canvas');
  // eslint-disable-next-line no-console
  console.log('flatted');
  return planning;
};

export default async function plan(source) {
  const planing = await flatten(source);
  return planing;
}
