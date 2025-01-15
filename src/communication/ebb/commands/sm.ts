import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams, createCommand } from '../utils';

export const cmd = 'SM';

export default createCommand(
  cmd,
  'Stepper move',
  function* (duration: number, axis1: number, axis2?: number) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${duration.toFixed(0)},${axis1.toFixed(0)}`,
      axis2,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
  },
);
