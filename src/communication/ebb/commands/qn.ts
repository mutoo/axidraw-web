import { createCommand } from '../command';
import { ENDING_OK_CR_NL } from '../constants';
import { noParameters, readUntil, toInt, transformResult } from '../utils';

export const cmd = 'QN';

export default createCommand(
  cmd,
  'Query node count',
  function* () {
    const dataIn = yield `${cmd}\r`;
    // example response: "256\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result));
  },
  noParameters,
  {
    version: '1.9.2',
  },
);
