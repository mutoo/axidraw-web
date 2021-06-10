import { createCommand, readUntil, toInt, transformResult } from '../utils.js';
import { ENDING_OK_CR_NL } from '../constants.js';

export default createCommand(
  'Query current',
  function* () {
    const dataIn = yield 'QC\r';
    // example response: "0394,0300\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      const values = result
        .substring(0, result.length - 6)
        .split(',')
        .map((v) => ((toInt(v) / 1023) * 3.3).toFixed(2));
      return {
        ra0: {
          voltage: values[0],
          maxCurrent: (values[0] / 1.76).toFixed(2),
        },
        vPlus: {
          voltage: (values[1] * 9.2 + 0.3).toFixed(2),
        },
      };
    });
  },
  {
    version: '2.2.3',
  },
);
