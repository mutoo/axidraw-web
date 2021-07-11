import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';
import { EXECUTION_FIFO } from '../constants';

export default createCommand(
  'Stepper move, mixed-axis geometries',
  function* (duration, xSteps, ySteps) {
    const dataIn = yield `XM,${duration},${xSteps},${ySteps}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.3.0',
  },
);
