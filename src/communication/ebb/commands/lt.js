import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export const cmd = 'LT';

export default createCommand(
  cmd,
  'Low-level move, time-limited',
  function* (intervals, rate1, accel1, rate2, accel2, clear) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${[intervals, rate1, accel1, rate2, accel2].join(',')}`,
      clear,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.7.0',
  },
);
