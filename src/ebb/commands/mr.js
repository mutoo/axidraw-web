import { createCommand, readUntil, toInt, transformResult } from '../utils.js';
import { ENDING_CR_NL } from '../constants.js';

export default createCommand('Memory Read', function* (address) {
  const dataIn = yield `MR,${address}\r`;
  // example response: "MR,071\r\n"
  const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
  return transformResult(parsed, (result) => toInt(result.substr(3)));
});
