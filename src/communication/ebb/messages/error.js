import { ENDING_CR } from '../constants';
import { readUntil } from '../utils';

export default function* handleErrorMessage() {
  let parsed = null;
  let result = '';
  do {
    const dataIn = yield parsed;
    // The error message may ends with \r\n or \n\r
    parsed = yield* readUntil(ENDING_CR, dataIn);
    result += parsed.result;
  } while (parsed.remain[0] === '!');
  return {
    ...parsed,
    result,
  };
}
