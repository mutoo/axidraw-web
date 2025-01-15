import L from './cmd-l';
import { MoveTo } from './parser';
import { StepAndStoreXY } from './steppers';
import { transformerXY } from './transformers';
import { Context, normalize, SingleCommand } from './utils';

export default function* (command: MoveTo, context: Context) {
  const [cmd, coordinatePair, ...coordinatePairs] = command;
  yield normalize<SingleCommand<MoveTo>>(
    cmd,
    coordinatePair,
    context,
    StepAndStoreXY,
    transformerXY,
  );
  // the following coordinate pairs are for line commands
  if (coordinatePairs.length) {
    yield* L(
      [{ M: 'L' as const, m: 'l' as const }[cmd], ...coordinatePairs],
      context,
    );
  }
}
