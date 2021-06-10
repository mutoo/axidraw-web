import {
  cmdWithOptionalParams,
  createCommand,
  handleOKMessage,
} from '../utils.js';
import { EXECUTION_FIFO } from '../constants.js';

export default createCommand(
  'Home or absolute move',
  function* (stepFrequency, axis1, axis2) {
    const dataIn = yield cmdWithOptionalParams(
      `HM,${stepFrequency}`,
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
