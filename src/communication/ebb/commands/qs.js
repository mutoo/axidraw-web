import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_OK_CR_NL } from '../constants';

export const cmd = 'QS';

export default createCommand(
  cmd,
  'Query step position',
  function* () {
    const dataIn = yield `${cmd}\r`;
    // example response: "1024,-512\n\rOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      const positions = result
        .substring(0, result.length - 6)
        .split(',')
        .map(toInt);
      return {
        a1: positions[0],
        a2: positions[1],
      };
    });
  },
  {
    version: '2.4.3',
  },
);
