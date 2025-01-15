import { ClosePath, Command, HorizontalLineTo, VerticalLineTo } from './parser';
import { Context, SingleCommand } from './utils';

export const stepX = (
  param: HorizontalLineTo[1],
  context: Context,
  isAbsoluteCmd: boolean,
) => {
  if (isAbsoluteCmd) {
    context.x = param;
  } else {
    context.x += param;
  }
};

export const stepY = (
  param: VerticalLineTo[1],
  context: Context,
  isAbsoluteCmd: boolean,
) => {
  if (isAbsoluteCmd) {
    context.y = param;
  } else {
    context.y += param;
  }
};

export const stepXY = (
  params: SingleCommand<
    Exclude<Command, HorizontalLineTo | VerticalLineTo | ClosePath>
  >[1],
  context: Context,
  isAbsoluteCmd: boolean,
) => {
  // the params may be a single pair of coordinates or multiple pairs
  const lastParam = params[params.length - 1];
  const coordinatePair = (
    typeof lastParam === 'number' ? params : lastParam
  ) as [number, number];

  if (isAbsoluteCmd) {
    context.x = coordinatePair[0];
    context.y = coordinatePair[1];
  } else {
    context.x += coordinatePair[0];
    context.y += coordinatePair[1];
  }
};

export const storeXY = (_: unknown, context: Context) => {
  context.startX = context.x;
  context.startY = context.y;
};

export const StepAndStoreXY = (
  params: SingleCommand<
    Exclude<Command, HorizontalLineTo | VerticalLineTo | ClosePath>
  >[1],
  context: Context,
  isAbsoluteCmd: boolean,
) => {
  stepXY(params, context, isAbsoluteCmd);
  storeXY(null, context);
};

export const resetXY = (_: unknown, context: Context) => {
  context.x = context.startX;
  context.y = context.startY;
};
