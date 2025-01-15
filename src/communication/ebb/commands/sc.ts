import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'SC';

export default createCommand(
  cmd,
  'Stepper and Servo mode configure',
  function* (value1: number, value2: number) {
    const dataIn = yield `${cmd},${value1.toFixed(0)},${value2.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
