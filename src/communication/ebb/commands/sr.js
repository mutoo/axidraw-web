import { cmdWithOptionalParams, createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'SR';

export default createCommand(
  cmd,
  'Set RC Servo power timeout',
  function* (timeout, state) {
    const dataIn = yield cmdWithOptionalParams(`${cmd},${timeout}`, state);
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.6.0',
  },
);
