import { createCommand } from '../command';
import { ENDING_CR_NL } from '../constants';
import { readUntil, toInt, transformResult } from '../utils';

export const cmd = 'MR';

export default createCommand(
  cmd,
  'Memory Read',
  function* (address: number) {
    const dataIn = yield `${cmd},${address.toFixed(0)}\r`;
    // example response: "MR,071\r\n"
    const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result.substring(3)));
  },
  (params: string): [number] => {
    return [toInt(params)];
  },
);
