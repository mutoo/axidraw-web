import {
  cmdWithOptionalParams,
  createCommand,
  readUntil,
  toInt,
  transformResult,
} from '../utils';
import { ENDING_OK_CR_NL } from '../constants';

export default createCommand(
  'E stop',
  function* (disableMotors) {
    const dataIn = yield cmdWithOptionalParams('ES', disableMotors);
    // example response: "0,0,0,0,0\n\rOK\r\n"
    const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
    return transformResult(parsed, (result) => {
      const values = result
        .substring(0, result.length - 6)
        .split(',')
        .map(toInt);
      return {
        interrupted: values[0],
        axis1: {
          steps: values[1],
          remain: values[3],
        },
        axis2: {
          steps: values[2],
          remain: values[4],
        },
      };
    });
  },
  {
    version: '2.2.7',
  },
);
