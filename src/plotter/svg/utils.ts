import { Line2D } from '@/math/geom';
import { SvgToLinesOptions } from './svg-to-lines';

export function createSVGElement(type: string) {
  return document.createElementNS('http://www.w3.org/2000/svg', type);
}

export function getAttrVal<T extends SVGGeometryElement>(
  svgEl: T,
  attr: keyof T,
): number {
  return (svgEl[attr] as SVGAnimatedLength).baseVal.value;
}

export type Line2DWithId = Line2D & {
  groupId: string;
  elementId: number;
};

export function attachIds(
  line: Line2D,
  { groups, elementId }: SvgToLinesOptions,
): Line2DWithId {
  const line2DWithId = [...line] as Line2DWithId;
  line2DWithId.groupId = groups.join('-');
  line2DWithId.elementId = elementId;
  return line2DWithId;
}
