import { ENDING_OK_CR_NL } from '../constants';
import { createCommand, readUntil, toInt, transformResult } from '../utils';

export const cmd = 'QL';

export default createCommand(
  cmd,
  'Query layer',
  function* () {
    const dataIn = yield `${cmd}\r`;
    // example response: "4\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result));
  },
  {
    version: '1.9.2',
  },
);
