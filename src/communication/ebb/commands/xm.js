import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';
import { EXECUTION_FIFO } from '../constants';

export const cmd = 'XM';

export default createCommand(
  cmd,
  'Stepper move, mixed-axis geometries',
  function* (duration, xSteps, ySteps) {
    const dataIn = yield `${cmd},${duration},${xSteps},${ySteps}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.3.0',
  },
);
