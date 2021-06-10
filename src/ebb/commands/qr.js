import { createCommand, readUntil, toInt, transformResult } from '../utils.js';
import { ENDING_OK_CR_NL } from '../constants.js';

export default createCommand(
  'Query RC Servo power state',
  function* () {
    const dataIn = yield 'QR\r';
    // example response: "1\n\rOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result));
  },
  {
    version: '2.6.0',
  },
);
