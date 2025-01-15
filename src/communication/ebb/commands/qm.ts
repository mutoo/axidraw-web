import { ENDING_NL_CR } from '../constants';
import { createCommand, readUntil, toInt, transformResult } from '../utils';

export const cmd = 'QM';

export default createCommand(
  cmd,
  'Query motors',
  function* () {
    const dataIn = yield `${cmd}\r`;
    // example response: "QM,0,0,0,0\n\r"
    // N.B. QM is the only command returning \n\r
    // https://github.com/evil-mad/EggBot/issues/159
    const parsed = yield* readUntil(ENDING_NL_CR, dataIn);
    return transformResult(parsed, (result) => {
      const results = result.trim().substring(3).split(',').map(toInt);
      return {
        command: results[0],
        motor1: results[1],
        motor2: results[2],
        fifo: results[3],
      };
    });
  },
  {
    version: '2.4.4',
  },
);
