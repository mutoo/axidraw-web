import type { SmoothCurveTo } from './parser';
import { stepXY } from './steppers';
import { transformerXYPairs } from './transformers';
import type { Context, SingleCommand } from './utils';
import { normalize } from './utils';

export default function* (command: SmoothCurveTo, context: Context) {
  const [cmd, ...params] = command;
  for (const param of params) {
    yield normalize<SingleCommand<SmoothCurveTo>>(
      cmd,
      param,
      context,
      stepXY,
      transformerXYPairs,
    );
  }
}
