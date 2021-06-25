export const createSVGElement = (type) =>
  document.createElementNS('http://www.w3.org/2000/svg', type);

export const getAttrVal = (svgEl, attr) => svgEl[attr]?.baseVal.value ?? 0;
