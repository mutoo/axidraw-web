export function createSVGElement(type) {
  return document.createElementNS('http://www.w3.org/2000/svg', type);
}

export function getAttrVal(svgEl, attr) {
  return svgEl[attr]?.baseVal.value ?? 0;
}

export function attachIds(line, { groups, elementId }) {
  line.groupId = groups.join('-');
  line.elementId = elementId;
  return line;
}
