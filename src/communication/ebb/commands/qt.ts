import { ENDING_OK_CR_NL } from '../constants';
import { createCommand, readUntil, transformResult } from '../utils';

export const cmd = 'QT';

export default createCommand(
  cmd,
  'Query EBB nickname tag',
  function* () {
    const dataIn = yield `${cmd}\r`;
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
