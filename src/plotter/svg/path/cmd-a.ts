import { EllipticalArc } from './parser';
import { stepXY } from './steppers';
import { transformerXY } from './transformers';
import { Context, normalize, SingleCommand } from './utils';

export default function* (command: EllipticalArc, context: Context) {
  const [cmd, ...params] = command;
  for (const param of params) {
    yield normalize<SingleCommand<EllipticalArc>>(
      cmd,
      param,
      context,
      stepXY,
      transformerXY,
    );
  }
}
