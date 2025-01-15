import { Point2D } from '@/math/geom';
import {
  CurveTo,
  EllipticalArc,
  HorizontalLineTo,
  LineTo,
  MoveTo,
  numberPair,
  QuadBezierCurveTo,
  SmoothCurveTo,
  SmoothQuadBezierCurveTo,
  VerticalLineTo,
} from './parser';
import { Context, SingleCommand } from './utils';

export const transformerXY = <
  T extends SingleCommand<
    EllipticalArc | LineTo | MoveTo | SmoothQuadBezierCurveTo
  >[1],
>(
  params: T,
  context: Context,
) => {
  // the params may be a single pair of coordinates or multiple pairs
  const lastParam = params[params.length - 1];
  if (typeof lastParam === 'number') {
    const coordinatePair = params as numberPair;
    return [coordinatePair[0] + context.x, coordinatePair[1] + context.y] as T;
  }

  const transformed = [...params];
  // most commands store the coordinate-pair at last param
  const [x, y] = transformed[transformed.length - 1] as Point2D;
  transformed[transformed.length - 1] = [x + context.x, y + context.y];
  return transformed as T;
};

export const transformerX = <T extends HorizontalLineTo[1]>(
  x: T,
  context: Context,
) => {
  return (x + context.x) as T;
};

export const transformerY = <T extends VerticalLineTo[1]>(
  y: T,
  context: Context,
) => {
  return (y + context.y) as T;
};

export const transformerXYPairs = <
  T extends SingleCommand<CurveTo | SmoothCurveTo | QuadBezierCurveTo>[1],
>(
  params: T,
  context: Context,
) => {
  return (params as numberPair[]).map(([x, y]) => [
    x + context.x,
    y + context.y,
  ]) as T;
};
