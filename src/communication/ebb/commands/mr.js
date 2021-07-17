import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_CR_NL } from '../constants';

export const cmd = 'MR';

export default createCommand(cmd, 'Memory Read', function* (address) {
  const dataIn = yield `${cmd},${address}\r`;
  // example response: "MR,071\r\n"
  const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
  return transformResult(parsed, (result) => toInt(result.substr(3)));
});
