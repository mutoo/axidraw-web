import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'CU';

export default createCommand(
  cmd,
  'Configure user options',
  function* (number, value) {
    const dataIn = yield `${cmd},${[number, value].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
