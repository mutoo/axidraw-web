import { VerticalLineTo } from './parser';
import { stepY } from './steppers';
import { transformerY } from './transformers';
import { Context, normalize, SingleCommand } from './utils';

export default function* (command: VerticalLineTo, context: Context) {
  const [cmd, ...coordinates] = command;
  for (const coordinate of coordinates) {
    yield normalize<SingleCommand<VerticalLineTo>>(
      cmd,
      coordinate,
      context,
      stepY,
      transformerY,
    );
  }
}
