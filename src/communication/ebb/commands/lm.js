import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Low-level move, step-limited',
  function* (rate1, steps1, accel1, rate2, steps2, accel2, clear) {
    const dataIn = yield cmdWithOptionalParams(
      `LM,${[rate1, steps1, accel1, rate2, steps2, accel2].join(',')}`,
      clear,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.7.0',
  },
);
