import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'AC';

export default createCommand(
  cmd,
  'Analog configure',
  function* (channel: string, enable: string) {
    const dataIn = yield `${cmd},${[channel, enable].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.2.3',
  },
);
