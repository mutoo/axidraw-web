import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

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
  (params: string): [number, number, number, number, number] => {
    const [portA, portB, portC, portD, portE] = params
      .split(',')
      .map((p) => parseInt(p, 10));
    return [portA, portB, portC, portD, portE];
  },
);
