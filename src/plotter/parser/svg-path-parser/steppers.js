export const stepX = (params, context, isAbsoluteCmd) => {
  if (isAbsoluteCmd) {
    context.x = params[params.length - 1];
  } else {
    context.x += params[params.length - 1];
  }
};

export const stepY = (params, context, isAbsoluteCmd) => {
  if (isAbsoluteCmd) {
    context.y = params[params.length - 1];
  } else {
    context.y += params[params.length - 1];
  }
};

export const stepXY = (params, context, isAbsoluteCmd) => {
  if (isAbsoluteCmd) {
    context.x = params[params.length - 2];
    context.y = params[params.length - 1];
  } else {
    context.x += params[params.length - 2];
    context.y += params[params.length - 1];
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
