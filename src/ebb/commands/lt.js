import {
  cmdWithOptionalParams,
  createCommand,
  handleOKMessage,
} from '../utils.js';
import { EXECUTION_FIFO } from '../constants.js';

export default createCommand(
  'Low-level move, time-limited',
  function* (intervals, rate1, accel1, rate2, accel2, clear) {
    const dataIn = yield cmdWithOptionalParams(
      `LT,${[intervals, rate1, accel1, rate2, accel2].join(',')}`,
      clear,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.7.0',
  },
);
