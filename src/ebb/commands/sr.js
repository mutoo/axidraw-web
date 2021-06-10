import {
  cmdWithOptionalParams,
  createCommand,
  handleOKMessage,
} from '../utils.js';

export default createCommand(
  'Set RC Servo power timeout',
  function* (timeout, state) {
    const dataIn = yield cmdWithOptionalParams(`SR,${timeout}`, state);
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.6.0',
  },
);
