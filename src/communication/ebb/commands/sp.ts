import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams, createCommand } from '../utils';

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
  {
    execution: EXECUTION_FIFO,
  },
);
