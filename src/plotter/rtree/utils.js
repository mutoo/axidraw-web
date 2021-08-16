export function pointAsMbr(p) {
  return { p0: [...p], p1: [...p] };
}

export function formatMbr({ p0: [x0, y0], p1: [x1, y1] }) {
  return `(${x0}, ${y0}), (${x1}, ${y1})`;
}

export function extendMbr(mbr0, mbr1) {
  if (!mbr0) return mbr1;
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = mbr0;
  const {
    p0: [ep0x, ep0y],
    p1: [ep1x, ep1y],
  } = mbr1;
  const p0x = Math.min(np0x, ep0x);
  const p0y = Math.min(np0y, ep0y);
  const p1x = Math.max(np1x, ep1x);
  const p1y = Math.max(np1y, ep1y);
  return {
    p0: [p0x, p0y],
    p1: [p1x, p1y],
  };
}

export function extendMbrPlan(node, entryMbr) {
  const extendedMbr = extendMbr(node.mbr, entryMbr);
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = node.mbr;
  const {
    p0: [p0x, p0y],
    p1: [p1x, p1y],
  } = extendedMbr;
  const originalArea = (np1x - np0x) * (np1y - np0y);
  const extendedArea = (p1x - p0x) * (p1y - p0y);
  const cost = extendedArea - originalArea;
  return {
    node,
    extendedMbr,
    extendedArea,
    originalArea,
    cost,
  };
}

export function canCoverMbr(nodeMbr, entryMbr) {
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = nodeMbr;
  const {
    p0: [ep0x, ep0y],
    p1: [ep1x, ep1y],
  } = entryMbr;
  return (
    np0x <= ep0x &&
    ep0x <= np1x &&
    np0x <= ep1x &&
    ep1x <= np1x &&
    np0y <= ep0y &&
    ep0y <= np1y &&
    np0y <= ep1y &&
    ep1y <= np1y
  );
}

export function mergeMbrs(mbrs) {
  if (!mbrs.length) return null;
  return mbrs.reduce(extendMbr);
}

export function batchAddToNode(addToNode, entries, startIdx, endIdx) {
  for (let i = startIdx; i < endIdx; i += 1) {
    const entryToAdd = entries[i];
    // eslint-disable-next-line no-param-reassign
    addToNode.entries.push(entryToAdd);
    entryToAdd.parent = addToNode;
    const extended = extendMbrPlan(addToNode, entryToAdd.mbr);
    // eslint-disable-next-line no-param-reassign
    addToNode.mbr = extended.extendedMbr;
  }
}
