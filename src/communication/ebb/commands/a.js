import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_CR_NL } from '../constants';

export default createCommand(
  'Get analog values',
  function* () {
    const dataIn = yield 'A\r';
    // example response: "A,00:0713,02:0241,05:0089:09:1004\r\n"
    const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      const pairs = result.trim().substr(2).split(',');
      return pairs.reduce((memo, pair) => {
        const [port, value] = pair.split(':');
        return { ...memo, [toInt(port)]: toInt(value) };
      }, {});
    });
  },
  {
    version: '2.2.3',
  },
);
