// eslint-disable-next-line no-unused-vars
export default function* svgBezierToLines(bezier, startPos, ctm, opt) {
  if (!bezier || bezier[0] !== 'C') {
    throw new Error(`invalid bezier: ${bezier}`);
  }
  return startPos;
}
