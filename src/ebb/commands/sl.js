import { createCommand, handleOKMessage } from '../utils.js';

export default createCommand(
  'Set layer',
  function* (layer) {
    const dataIn = yield `SL,${layer}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.2',
  },
);
