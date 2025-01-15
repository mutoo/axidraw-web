import { QuadBezierCurveTo } from './parser';
import { stepXY } from './steppers';
import { transformerXYPairs } from './transformers';
import { Context, normalize, SingleCommand } from './utils';

export default function* (command: QuadBezierCurveTo, context: Context) {
  const [cmd, ...params] = command;
  for (const param of params) {
    yield normalize<SingleCommand<QuadBezierCurveTo>>(
      cmd,
      param,
      context,
      stepXY,
      transformerXYPairs,
    );
  }
}
