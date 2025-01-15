import { CommandGenerator } from '../command';
import { ENDING_CR } from '../constants';
import { readUntil } from '../utils';

export default function* handleErrorMessage(): CommandGenerator<string> {
  let parsed: { consumed: number; remain: string; result?: string } = {
    consumed: 0,
    remain: '',
  };
  let result = '';
  do {
    const dataIn: number[] = yield parsed;
    // The error message may ends with \r\n or \n\r
    parsed = yield* readUntil(ENDING_CR, dataIn);
    result += (parsed as { result: string }).result;
  } while ((parsed as { remain: string }).remain[0] === '!');
  return {
    ...(parsed as { consumed: number; remain: string }),
    result,
  };
}
