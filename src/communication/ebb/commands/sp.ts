import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'SP';

export default createCommand(
  cmd,
  'Set pen state',
  function* (value: number, duration?: number, portBPin?: number) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${value.toFixed(0)}`,
      duration,
      portBPin,
    );
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number | undefined, number | undefined] => {
    const [value, duration, portBPin] = params.split(',').map(Number);
    return [value, duration, portBPin];
  },
  {
    execution: EXECUTION_FIFO,
  },
);
