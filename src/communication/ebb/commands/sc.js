import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Stepper and Servo mode configure',
  function* (value1, value2) {
    const dataIn = yield `SC,${value1},${value2}\r`;
    return yield* handleOKMessage(dataIn);
  },
);