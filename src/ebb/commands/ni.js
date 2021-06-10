import { createCommand, handleOKMessage } from '../utils.js';

export default createCommand(
  'Node count increment',
  function* () {
    const dataIn = yield `NI\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
