import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'LM';

export default createCommand(
  cmd,
  'Low-level move, step-limited',
  function* (
    rate1: number,
    steps1: number,
    accel1: number,
    rate2: number,
    steps2: number,
    accel2: number,
    clear?: number,
  ) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${[rate1, steps1, accel1, rate2, steps2, accel2].join(',')}`,
      clear,
    );
    return yield* handleOKMessage(dataIn);
  },
  (
    params: string,
  ): [number, number, number, number, number, number, number] => {
    const [rate1, steps1, accel1, rate2, steps2, accel2, clear] = params
      .split(',')
      .map((p) => parseInt(p, 10));
    return [rate1, steps1, accel1, rate2, steps2, accel2, clear];
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.7.0',
  },
);
