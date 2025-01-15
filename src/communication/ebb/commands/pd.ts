import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'PD';

export default createCommand(
  cmd,
  'Pin direction',
  function* (port: string, pin: number, direction: number) {
    const dataIn =
      yield `${cmd},${port},${pin.toFixed(0)},${direction.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
