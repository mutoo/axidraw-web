import { logger } from './utils';

export function* walkSvg(
  svg: SVGElement,
): Generator<{ action: 'count' | 'discard'; el: SVGElement; type: string }> {
  for (const child of svg.children) {
    const svgEl = child as SVGElement;
    const type = svgEl.nodeName;
    switch (type) {
      case 'svg':
      case 'g':
      case 'a':
        yield* walkSvg(svgEl);
        break;
      case 'rect':
      case 'circle':
      case 'ellipse':
      case 'line':
      case 'polyline':
      case 'polygon':
      case 'path':
        // keep them;
        yield { action: 'count', el: svgEl, type };
        break;
      default:
        yield { action: 'discard', el: svgEl, type };
    }
  }
}

export default function clean(svg: SVGElement) {
  const counts: Record<string, number> = {};
  const toDiscard: SVGElement[] = [];
  for (const node of walkSvg(svg)) {
    switch (node.action) {
      case 'count':
        counts[node.type] = (counts[node.type] || 0) + 1;
        break;
      case 'discard':
      default:
        counts[node.action] = (counts[node.action] || 0) + 1;
        logger.debug(`Unsupported element type: ${node.type}`);
        toDiscard.push(node.el);
    }
  }
  for (const el of toDiscard) {
    el.remove();
  }
  return { counts };
}
