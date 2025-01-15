import { ENDING_OK_CR_NL } from '../constants';
import { createCommand, readUntil, toInt, transformResult } from '../utils';

export const cmd = 'QP';

export default createCommand(
  cmd,
  'Query pen',
  function* () {
    const dataIn = yield `${cmd}\r`;
    // example response: "1\n\rOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result));
  },
  {
    version: '1.9.0',
  },
);
