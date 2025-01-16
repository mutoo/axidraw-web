import { CommandGenerator, createCommand } from '../command';
import { ENDING_CR_NL } from '../constants';
import { noParameters, readUntil, toInt, transformResult } from '../utils';

export const cmd = 'A';

export default createCommand(
  cmd,
  'Get analog values',
  function* (): CommandGenerator<{ [port: number]: number }> {
    const dataIn = yield `${cmd}\r`;
    // example response: "A,00:0713,02:0241,05:0089:09:1004\r\n"
    const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      const pairs = result.trim().substring(2).split(',');
      return pairs.reduce((memo, pair) => {
        const [port, value] = pair.split(':');
        return { ...memo, [toInt(port)]: toInt(value) };
      }, {});
    });
  },
  noParameters,
  {
    version: '2.2.3',
  },
);
