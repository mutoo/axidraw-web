import { createCommand, handleOKMessage } from '../utils.js';

export default createCommand(
  'Set node count',
  function* (count) {
    const dataIn = yield `SN,${count}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
