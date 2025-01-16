import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'SC';

export default createCommand(
  cmd,
  'Stepper and Servo mode configure',
  function* (value1: number, value2: number) {
    const dataIn = yield `${cmd},${value1.toFixed(0)},${value2.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number] => {
    const [value1, value2] = params.split(',').map((p) => parseInt(p, 10));
    return [value1, value2];
  },
);
