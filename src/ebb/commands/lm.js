import {
  cmdWithOptionalParams,
  createCommand,
  handleOKMessage,
} from '../utils.js';
import { EXECUTION_FIFO } from '../constants.js';

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
