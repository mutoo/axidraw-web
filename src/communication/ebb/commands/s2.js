import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export const cmd = 'S2';

export default createCommand(
  cmd,
  'General RC Servo output',
  function* (position, outputPin, rate, delay) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${position},${outputPin}`,
      rate,
      delay,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.2.0',
  },
);
