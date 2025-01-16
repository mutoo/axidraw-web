import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

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
  (params: string): [number, number, number | undefined] => {
    const [duration, axis1, axis2] = params.split(',').map(Number);
    return [duration, axis1, axis2];
  },
  {
    execution: EXECUTION_FIFO,
  },
);
