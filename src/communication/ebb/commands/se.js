import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Set engraver',
  function* (state, power, useMotionQueue) {
    const dataIn = yield cmdWithOptionalParams(
      `SE,${state}`,
      power,
      useMotionQueue,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.1.0',
  },
);
