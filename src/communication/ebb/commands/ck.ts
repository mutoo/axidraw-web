import { CommandGenerator, createCommand } from '../command';
import { ENDING_OK_CR_NL } from '../constants';
import { readUntil, toInt, transformResult } from '../utils';

export const cmd = 'CK';

export default createCommand(
  cmd,
  'Check input',
  function* (
    v1: number,
    v2: number,
    v3: number,
    v4: number,
    v5: number,
    v6: number,
    v7: string,
    v8: string,
  ): CommandGenerator<(number | string)[]> {
    const dataIn = yield `${cmd},${[v1, v2, v3, v4, v5, v6, v7, v8].join(
      ',',
    )}\r`;
    // example response: "Param1=0\r\nParam2=0\r\nParam3=0\r\nParam4=0\r\nParam5=0\r\nParam6=0\r\nParam7=a\r\nParam8=A\r\nOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      return result
        .substring(0, result.length - 6) // discard \r\nOK\r\n
        .split(/\s+/)
        .map((pair, idx) => {
          const value = pair.split('=')[1];
          return idx < 6 ? toInt(value) : value;
        });
    });
  },
  (
    params: string,
  ): [number, number, number, number, number, number, string, string] => {
    const [v1, v2, v3, v4, v5, v6, v7, v8] = params.split(',');
    const [n1, n2, n3, n4, n5, n6] = [v1, v2, v3, v4, v5, v6].map((p) =>
      parseInt(p, 10),
    );
    return [n1, n2, n3, n4, n5, n6, v7, v8];
  },
);
