import { createCommand } from '../command';
import { ENDING_OK_CR_NL } from '../constants';
import {
  cmdWithOptionalParams,
  readUntil,
  toInt,
  transformResult,
} from '../utils';

export const cmd = 'ES';

export default createCommand(
  cmd,
  'E stop',
  function* (disableMotors?: number) {
    const dataIn = yield cmdWithOptionalParams(cmd, disableMotors);
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
  (params: string): [number | undefined] => {
    const [n] = params.split(',').map(toInt);
    return [n];
  },
  {
    version: '2.2.7',
  },
);
