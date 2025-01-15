import { ClosePath } from './parser';
import { resetXY } from './steppers';
import { Context, SingleCommand } from './utils';

export default function* (command: ClosePath, context: Context) {
  resetXY(null, context);
  yield [
    context.toAbsolute ? ('Z' as const) : command[0],
    undefined,
  ] as SingleCommand<ClosePath>;
}
