import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'PD';

export default createCommand(
  cmd,
  'Pin direction',
  function* (port: string, pin: number, direction: number) {
    const dataIn =
      yield `${cmd},${port},${pin.toFixed(0)},${direction.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [string, number, number] => {
    const [port, pin, direction] = params.split(',');
    return [port, parseInt(pin, 10), parseInt(direction, 10)];
  },
);
