import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_OK_CR_NL } from '../constants';

export const cmd = 'CK';

export default createCommand(
  cmd,
  'Check input',
  function* (v1, v2, v3, v4, v5, v6, v7, v8) {
    const dataIn = yield `${cmd},${[v1, v2, v3, v4, v5, v6, v7, v8].join(
      ',',
    )}\r`;
    // example response: "Param1=0\r\nParam2=0\r\nParam3=0\r\nParam4=0\r\nParam5=0\r\nParam6=0\r\nParam7=a\r\nParam8=A\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      return result
        .substring(0, result.length - 6)
        .split(/\s+/)
        .map((pair, idx) => {
          const value = pair.split('=')[1];
          return idx < 6 ? toInt(value) : value;
        });
    });
  },
);
