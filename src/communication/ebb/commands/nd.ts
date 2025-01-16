import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { noParameters } from '../utils';

export const cmd = 'ND';

export default createCommand(
  cmd,
  'Node count decrement',
  function* () {
    const dataIn = yield `ND\r`;
    return yield* handleOKMessage(dataIn);
  },
  noParameters,
  {
    version: '1.9.5',
  },
);
