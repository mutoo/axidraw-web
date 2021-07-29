export const transformerXY = (params, context) => {
  const transformed = [...params];
  // most commands store the coordinate-pair at last param
  const [x, y] = transformed[transformed.length - 1];
  transformed[transformed.length - 1] = [x + context.x, y + context.y];
  return transformed;
};

export const transformerX = ([x], context) => {
  return [x + context.x];
};

export const transformerY = ([y], context) => {
  return [y + context.y];
};

export const transformerXYPairs = (coordinatePairs, context) =>
  coordinatePairs.map(([x, y]) => [x + context.x, y + context.y]);
