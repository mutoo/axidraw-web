import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_OK_CR_NL } from '../constants';

export const cmd = 'QR';

export default createCommand(
  cmd,
  'Query RC Servo power state',
  function* () {
    const dataIn = yield `${cmd}\r`;
    // example response: "1\n\rOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result));
  },
  {
    version: '2.6.0',
  },
);
