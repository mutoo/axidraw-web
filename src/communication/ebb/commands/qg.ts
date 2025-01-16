import { createCommand } from '../command';
import { ENDING_CR_NL } from '../constants';
import { noParameters, readUntil, toInt, transformResult } from '../utils';

export const cmd = 'QG';

export default createCommand(
  cmd,
  'Query general',
  function* () {
    const dataIn = yield `QG\r`;
    // example response: "3E\r\n"
    const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      const results = toInt(result);
      return {
        fifo: (results & 1) > 0,
        mtr2: (results & 2) > 0,
        mtr1: (results & 4) > 0,
        cmd: (results & 8) > 0,
        pen: (results & 16) > 0,
        prg: (results & 32) > 0,
        rb2: (results & 64) > 0,
        rb5: (results & 128) > 0,
      };
    });
  },
  noParameters,
  {
    version: '2.6.2',
  },
);
