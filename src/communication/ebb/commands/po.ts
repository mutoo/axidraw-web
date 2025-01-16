import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'PO';

export default createCommand(
  cmd,
  'Pin output',
  function* (port: string, pin: number, value: number) {
    const dataIn = yield `${cmd},${port},${pin},${value}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [string, number, number] => {
    const [port, pinStr, valueStr] = params.split(',');
    const pin = parseInt(pinStr, 10);
    const value = parseInt(valueStr, 10);
    return [port, pin, value];
  },
);
