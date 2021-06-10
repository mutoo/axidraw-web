import {
  cmdWithOptionalParams,
  createCommand,
  handleOKMessage,
} from '../utils.js';

export default createCommand(
  'Toggle pen',
  function* (duration) {
    const dataIn = yield cmdWithOptionalParams(`TP`, duration);
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.0',
  },
);
