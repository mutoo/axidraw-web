import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export const cmd = 'EM';

export default createCommand(
  cmd,
  'Enable Motors',
  function* (motor1: number, motor2: number) {
    const dataIn = yield `${cmd},${[motor1, motor2].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number] => {
    const [motor1, motor2] = params.split(',').map((p) => parseInt(p, 10));
    return [motor1, motor2];
  },
  {
    execution: EXECUTION_FIFO,
  },
);
