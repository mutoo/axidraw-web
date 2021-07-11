import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Analog configure',
  function* (channel, enable) {
    const dataIn = yield `AC,${[channel, enable].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.2.3',
  },
);
