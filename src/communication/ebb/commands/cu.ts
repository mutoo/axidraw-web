import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'CU';

export default createCommand(
  cmd,
  'Configure user options',
  function* (number, value) {
    const dataIn = yield `${cmd},${[number, value].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
