import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_OK_CR_NL } from '../constants';

export default createCommand(
  'Query motor enable',
  function* () {
    const dataIn = yield `QE\r`;
    // example response: "0,4\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      return result
        .substring(0, result.length - 6)
        .split(',')
        .map(toInt);
    });
  },
  {
    version: '2.8.0',
  },
);
