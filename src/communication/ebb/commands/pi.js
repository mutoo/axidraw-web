import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_CR_NL } from '../constants';

export default createCommand('Pin input', function* (port, pin) {
  const dataIn = yield `PI,${port},${pin}\r`;
  // example response: "PI,1\r\n"
  const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
  return transformResult(parsed, (result) => toInt(result.substr(3)));
});
