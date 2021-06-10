import { createCommand, handleOKMessage } from '../utils.js';

export default createCommand(
  'Configure pin direction',
  function* (portA, portB, portC, portD, portE) {
    const dataIn = yield `C,${[portA, portB, portC, portD, portE].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
