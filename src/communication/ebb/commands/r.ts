import { CommandGenerator, createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { noParameters } from '../utils';

export const cmd = 'R';

export default createCommand(
  cmd,
  'Reset',
  function* (): CommandGenerator<string> {
    let dataIn = yield `${cmd}\r`;
    const parsed = yield* handleOKMessage(dataIn);
    // the R command would receive OK twice
    dataIn = yield parsed;
    return yield* handleOKMessage(dataIn);
  },
  noParameters,
);
