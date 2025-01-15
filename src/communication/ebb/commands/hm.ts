import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams, createCommand } from '../utils';

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
  {
    execution: EXECUTION_FIFO,
    version: '2.6.2',
  },
);
