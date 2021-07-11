import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_OK_CR_NL } from '../constants';

export default createCommand(
  'Query node count',
  function* () {
    const dataIn = yield 'QN\r';
    // example response: "256\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result));
  },
  {
    version: '1.9.2',
  },
);
