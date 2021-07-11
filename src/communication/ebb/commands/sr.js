import { cmdWithOptionalParams, createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

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
