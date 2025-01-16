import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { noParameters } from '../utils';

export const cmd = 'CS';

export default createCommand(
  cmd,
  'Clear step position',
  function* () {
    const dataIn = yield `${cmd}\r`;
    return yield* handleOKMessage(dataIn);
  },
  noParameters,
  {
    version: '2.4.3',
  },
);
