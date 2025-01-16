import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'C';

export default createCommand(
  cmd,
  'Configure pin direction',
  function* (
    portA: number,
    portB: number,
    portC: number,
    portD: number,
    portE: number,
  ) {
    const dataIn = yield `${cmd},${[portA, portB, portC, portD, portE].join(
      ',',
    )}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number, number, number, number] => {
    const [portA, portB, portC, portD, portE] = params
      .split(',')
      .map((p) => parseInt(p, 10));
    return [portA, portB, portC, portD, portE];
  },
);
