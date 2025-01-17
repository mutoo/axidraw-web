import { createCommand } from '../command';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'HM';

export default createCommand(
  cmd,
  'Home or absolute move',
  function* (stepFrequency: number, axis1?: number, axis2?: number) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${stepFrequency}`,
      axis1,
      axis2,
    );
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number | undefined, number | undefined] => {
    const [stepFrequency, axis1, axis2] = params
      .split(',')
      .map((p) => parseInt(p, 10));
    return [stepFrequency, axis1, axis2];
  },
  {
    execution: EXECUTION_FIFO,
    version: '2.6.2',
  },
);
