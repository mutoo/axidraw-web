import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_OK_CR_NL } from '../constants';

export default createCommand(
  'Query button',
  function* () {
    const dataIn = yield 'QB\r';
    // example response: "0\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => toInt(result));
  },
  {
    version: '1.9.2',
  },
);
