import { createCommand, readUntil, transformResult } from '../utils.js';
import { ENDING_OK_CR_NL } from '../constants.js';

export default createCommand(
  'Query EBB nickname tag',
  function* () {
    const dataIn = yield 'QT\r';
    // example response: "East EBB\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) =>
      result.substring(0, result.length - 6),
    );
  },
  {
    version: '2.5.4',
  },
);
