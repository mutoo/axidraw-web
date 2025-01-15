import { CommandGenerator } from '../command';
import { ENDING_OK_CR_NL } from '../constants';
import { readUntil, transformResult } from '../utils';

export default function* handleOKMessage(
  dataIn: number[],
): CommandGenerator<string> {
  const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
  return transformResult(parsed, (result) => result.trim());
}
