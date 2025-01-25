import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { noParameters } from '../utils';

export const cmd = 'NI';

export default createCommand(
  cmd,
  'Node count increment',
  function* () {
    const dataIn = yield `NI\r`;
    return yield* handleOKMessage(dataIn);
  },
  noParameters,
  {
    version: '1.9.5',
  },
);
