import { createCommand, readUntil, toInt, transformResult } from '../utils.js';
import { ENDING_CR_NL } from '../constants.js';

export default createCommand('Input (digital)', function* () {
  const dataIn = yield 'I\r';
  // example response: "I,PortA,PortB,PortC,PortD,PortE\r\n"
  const parsed = yield* readUntil(ENDING_CR_NL, dataIn);
  return transformResult(parsed, (result) =>
    result.trim().substr(2).split(',').map(toInt),
  );
});
