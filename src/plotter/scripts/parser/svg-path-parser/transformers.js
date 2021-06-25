export const transformerXY = (params, context) => {
  const transformed = [...params];
  transformed[transformed.length - 2] += context.x;
  transformed[transformed.length - 1] += context.y;
  return transformed;
};

export const transformerX = (params, context) => {
  return [params[0] + context.x];
};

export const transformerY = (params, context) => {
  return [params[0] + context.y];
};
