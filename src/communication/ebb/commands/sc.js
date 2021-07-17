import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'SC';

export default createCommand(
  cmd,
  'Stepper and Servo mode configure',
  function* (value1, value2) {
    const dataIn = yield `${cmd},${value1},${value2}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
