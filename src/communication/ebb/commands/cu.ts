import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'CU';

export default createCommand(
  cmd,
  'Configure user options',
  function* (paramNumber: number, paramValue: number) {
    const dataIn = yield `${cmd},${[paramNumber, paramValue].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number] => {
    const [paramNumber, paramValue] = params
      .split(',')
      .map((p) => parseInt(p, 10));
    return [paramNumber, paramValue];
  },
);
