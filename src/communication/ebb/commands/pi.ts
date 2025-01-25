import { createCommand } from '../command';
import { ENDING_CR_NL } from '../constants';
import { readUntil, toInt, transformResult } from '../utils';

export const cmd = 'PI';

export default createCommand(
  cmd,
  'Pin input',
  function* (port: string, pin: number) {
    const dataIn = yield `${cmd},${port},${pin.toFixed(0)}\r`;
    // example response: "PI,1\r\n"
    const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result.substring(3)));
  },
  (params: string): [string, number] => {
    const [port, pin] = params.split(',');
    return [port, toInt(pin)];
  },
);
