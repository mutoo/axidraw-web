import { cmdWithOptionalParams, createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'O';

export default createCommand(
  cmd,
  'Output (digital)',
  function* (portA, portB, portC, portD, portE) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${portA}`,
      portB,
      portC,
      portD,
      portE,
    );
    return yield* handleOKMessage(dataIn);
  },
);
