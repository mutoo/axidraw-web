import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'XM';

export default createCommand(
  cmd,
  'Stepper move, mixed-axis geometries',
  function* (duration: number, xSteps: number, ySteps: number) {
    const dataIn =
      yield `${cmd},${duration.toFixed(0)},${xSteps.toFixed(0)},${ySteps.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.3.0',
  },
);
