import { createCommand, readUntil, toInt, transformResult } from '../utils.js';
import { ENDING_OK_CR_NL } from '../constants.js';

export default createCommand(
  'Query layer',
  function* () {
    const dataIn = yield 'QL\r';
    // example response: "4\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result));
  },
  {
    version: '1.9.2',
  },
);
