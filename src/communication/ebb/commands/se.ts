import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'SE';

export default createCommand(
  cmd,
  'Set engraver',
  function* (state: number, power?: number, useMotionQueue?: number) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${state.toFixed(0)}`,
      power,
      useMotionQueue,
    );
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number | undefined, number | undefined] => {
    const [state, power, useMotionQueue] = params.split(',').map(Number);
    return [state, power, useMotionQueue];
  },
  {
    // FIXME: this command only use FIFO queue when useMotionQueue is set to 1
    execution: EXECUTION_FIFO,
    version: '2.1.0',
  },
);
