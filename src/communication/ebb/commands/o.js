import { cmdWithOptionalParams, createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

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
