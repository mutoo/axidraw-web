import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'AC';

export default createCommand(
  cmd,
  'Analog configure',
  function* (channel, enable) {
    const dataIn = yield `${cmd},${[channel, enable].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.2.3',
  },
);
