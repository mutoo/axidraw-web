import { createCommand, readUntil, transformResult } from '../utils';
import { ENDING_CR_NL } from '../constants';

export const cmd = 'V';

export default createCommand(cmd, 'Version', function* () {
  const dataIn = yield `${cmd}\r`;
  // example response: "EBBv13_and_above EB Firmware Version 2.7.0\r\n"
  const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
  return transformResult(parsed, (result) => result.trim());
});
