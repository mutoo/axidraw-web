export default function clean(svg) {
  for (const svgEl of svg.children()) {
    switch (svgEl.type) {
      case 'svg':
      case 'g':
      case 'a':
        for (const child of svgEl.children()) {
          clean(child);
        }
        break;
      case 'rect':
      case 'circle':
      case 'ellipse':
      case 'line':
      case 'polyline':
      case 'polygon':
      case 'path':
        // keep them;
        break;
      default:
        console.debug(`Unsupported element type: ${svgEl.type}`);
        svgEl.remove();
    }
  }
}
