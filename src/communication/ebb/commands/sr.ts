import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'SR';

export default createCommand(
  cmd,
  'Set RC Servo power timeout',
  function* (timeout: number, state?: number) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${timeout.toFixed(0)}`,
      state,
    );
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number | undefined] => {
    const [timeout, state] = params.split(',').map(Number);
    return [timeout, state];
  },
  {
    version: '2.6.0',
  },
);
