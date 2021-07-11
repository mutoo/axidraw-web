import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'General RC Servo output',
  function* (position, outputPin, rate, delay) {
    const dataIn = yield cmdWithOptionalParams(
      `S2,${position},${outputPin}`,
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
