import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'C';

export default createCommand(
  cmd,
  'Configure pin direction',
  function* (portA, portB, portC, portD, portE) {
    const dataIn = yield `${cmd},${[portA, portB, portC, portD, portE].join(
      ',',
    )}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
