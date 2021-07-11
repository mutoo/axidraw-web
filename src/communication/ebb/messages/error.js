import { ENDING_CR_NL } from '../constants';
import { readUntil } from '../utils';

export default function* handleErrorMessage() {
  let parsed = null;
  let result = '';
  do {
    const dataIn = yield parsed;
    parsed = yield* readUntil(ENDING_CR_NL, dataIn);
    result += parsed.result;
  } while (parsed.remain[0] === '!');
  return {
    ...parsed,
    result,
  };
}
