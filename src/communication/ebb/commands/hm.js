import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export const cmd = 'HM';

export default createCommand(
  cmd,
  'Home or absolute move',
  function* (stepFrequency, axis1, axis2) {
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
