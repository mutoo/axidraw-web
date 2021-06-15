export function* walkSvg(svg) {
  for (const svgEl of svg.children()) {
    switch (svgEl.type) {
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
        yield { action: 'count', el: svgEl };
        break;
      default:
        yield { action: 'discard', el: svgEl };
    }
  }
}

export default function clean(svg) {
  const counts = {};
  for (const node of walkSvg(svg)) {
    switch (node.action) {
      case 'count':
        counts[node.el.type] = (counts[node.el.type] || 0) + 1;
        break;
      case 'discard':
      default:
        console.debug(`Unsupported element type: ${node.el.type}`);
        node.el.remove();
    }
  }
  return counts;
}
