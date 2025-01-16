import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'TP';

export default createCommand(
  cmd,
  'Toggle pen',
  function* (duration?: number) {
    const dataIn = yield cmdWithOptionalParams(cmd, duration);
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number | undefined] => {
    const [duration] = params.split(',').map(Number);
    return [duration];
  },
  {
    version: '1.9.0',
  },
);
