import type { LineTo } from './parser';
import { stepXY } from './steppers';
import { transformerXY } from './transformers';
import type { Context, SingleCommand } from './utils';
import { normalize } from './utils';

export default function* (command: LineTo, context: Context) {
  const [cmd, ...coordinatePairs] = command;
  for (const coordinatePair of coordinatePairs) {
    yield normalize<SingleCommand<LineTo>>(
      cmd,
      coordinatePair,
      context,
      stepXY,
      transformerXY,
    );
  }
}
