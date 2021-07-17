import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export const cmd = 'SE';

export default createCommand(
  cmd,
  'Set engraver',
  function* (state, power, useMotionQueue) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${state}`,
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
