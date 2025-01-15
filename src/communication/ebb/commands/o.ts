import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams, createCommand } from '../utils';

export const cmd = 'O';

export default createCommand(
  cmd,
  'Output (digital)',
  function* (
    portA: number,
    portB: number,
    portC: number,
    portD: number,
    portE: number,
  ) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${portA.toFixed(0)}`,
      portB,
      portC,
      portD,
      portE,
    );
    return yield* handleOKMessage(dataIn);
  },
);
