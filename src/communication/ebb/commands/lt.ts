import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'LT';

export default createCommand(
  cmd,
  'Low-level move, time-limited',
  function* (
    intervals: number,
    rate1: number,
    accel1: number,
    rate2: number,
    accel2: number,
    clear?: number,
  ) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${[intervals, rate1, accel1, rate2, accel2].join(',')}`,
      clear,
    );
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number, number, number, number, number] => {
    const [intervals, rate1, accel1, rate2, accel2, clear] = params
      .split(',')
      .map((p) => parseInt(p, 10));
    return [intervals, rate1, accel1, rate2, accel2, clear];
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.7.0',
  },
);
