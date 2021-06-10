import {
  cmdWithOptionalParams,
  createCommand,
  handleOKMessage,
} from '../utils.js';

export default createCommand(
  'Output (digital)',
  function* (portA, portB, portC, portD, portE) {
    const dataIn = yield cmdWithOptionalParams(
      `O,${portA}`,
      portB,
      portC,
      portD,
      portE,
    );
    return yield* handleOKMessage(dataIn);
  },
);
