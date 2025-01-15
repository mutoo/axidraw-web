import { CurveTo } from './parser';
import { stepXY } from './steppers';
import { transformerXYPairs } from './transformers';
import { Context, normalize, SingleCommand } from './utils';

export default function* (command: CurveTo, context: Context) {
  const [cmd, ...params] = command;
  for (const param of params) {
    yield normalize<SingleCommand<CurveTo>>(
      cmd,
      param,
      context,
      stepXY,
      transformerXYPairs,
    );
  }
}
