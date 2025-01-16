import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'S2';

export default createCommand(
  cmd,
  'General RC Servo output',
  function* (
    position: number,
    outputPin: number,
    rate?: number,
    delay?: number,
  ) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${position.toFixed(0)},${outputPin.toFixed(0)}`,
      rate,
      delay,
    );
    return yield* handleOKMessage(dataIn);
  },
  (
    params: string,
  ): [number, number, number | undefined, number | undefined] => {
    const [position, outputPin, rate, delay] = params.split(',').map(Number);
    return [position, outputPin, rate, delay];
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.2.0',
  },
);
