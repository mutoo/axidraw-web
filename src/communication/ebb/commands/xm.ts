import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export const cmd = 'XM';

export default createCommand(
  cmd,
  'Stepper move, mixed-axis geometries',
  function* (duration: number, xSteps: number, ySteps: number) {
    const dataIn =
      yield `${cmd},${duration.toFixed(0)},${xSteps.toFixed(0)},${ySteps.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number, number] => {
    const [duration, xSteps, ySteps] = params.split(',').map(Number);
    return [duration, xSteps, ySteps];
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.3.0',
  },
);
