import { HorizontalLineTo } from './parser';
import { stepX } from './steppers';
import { transformerX } from './transformers';
import { Context, normalize, SingleCommand } from './utils';

export default function* (command: HorizontalLineTo, context: Context) {
  const [cmd, ...coordinates] = command;
  for (const coordinate of coordinates) {
    yield normalize<SingleCommand<HorizontalLineTo>>(
      cmd,
      coordinate,
      context,
      stepX,
      transformerX,
    );
  }
}
