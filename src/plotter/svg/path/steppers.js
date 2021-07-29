export const stepX = (params, context, isAbsoluteCmd) => {
  if (isAbsoluteCmd) {
    context.x = params[0];
  } else {
    context.x += params[0];
  }
};

export const stepY = (params, context, isAbsoluteCmd) => {
  if (isAbsoluteCmd) {
    context.y = params[0];
  } else {
    context.y += params[0];
  }
};

export const stepXY = (params, context, isAbsoluteCmd) => {
  const coordinatePair = params[params.length - 1];
  if (isAbsoluteCmd) {
    context.x = coordinatePair[0];
    context.y = coordinatePair[1];
  } else {
    context.x += coordinatePair[0];
    context.y += coordinatePair[1];
  }
};

export const storeXY = (_, context) => {
  context.startX = context.x ?? 0;
  context.startY = context.y ?? 0;
};

export const resetXY = (_, context) => {
  context.x = context.startX ?? 0;
  context.y = context.startY ?? 0;
};
