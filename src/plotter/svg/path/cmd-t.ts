import { SmoothQuadBezierCurveTo } from './parser';
import { stepXY } from './steppers';
import { transformerXY } from './transformers';
import { Context, normalize, SingleCommand } from './utils';

export default function* (command: SmoothQuadBezierCurveTo, context: Context) {
  const [cmd, ...coordinatePairs] = command;
  for (const coordinatePair of coordinatePairs) {
    yield normalize<SingleCommand<SmoothQuadBezierCurveTo>>(
      cmd,
      coordinatePair,
      context,
      stepXY,
      transformerXY,
    );
  }
}
