import { createCommand, readUntil, toInt, transformResult } from '../utils';
import { ENDING_CR_NL } from '../constants';

export const cmd = 'I';

export default createCommand(cmd, 'Input (digital)', function* () {
  const dataIn = yield `${cmd}\r`;
  // example response: "I,PortA,PortB,PortC,PortD,PortE\r\n"
  const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
  return transformResult(parsed, (result) =>
    result.trim().substr(2).split(',').map(toInt),
  );
});
