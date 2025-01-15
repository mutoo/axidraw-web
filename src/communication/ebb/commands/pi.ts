import { ENDING_CR_NL } from '../constants';
import { createCommand, readUntil, toInt, transformResult } from '../utils';

export const cmd = 'PI';

export default createCommand(cmd, 'Pin input', function* (port:string, pin:number) {
  const dataIn = yield `${cmd},${port},${pin.toFixed(0)}\r`;
  // example response: "PI,1\r\n"
  const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
  return transformResult(parsed, (result) => toInt(result.substring(3)));
});
