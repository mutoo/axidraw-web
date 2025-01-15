import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams, createCommand } from '../utils';

export const cmd = 'LM';

export default createCommand(
  cmd,
  'Low-level move, step-limited',
  function* (rate1, steps1, accel1, rate2, steps2, accel2, clear?: number) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${[rate1, steps1, accel1, rate2, steps2, accel2].join(',')}`,
      clear,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.7.0',
  },
);
