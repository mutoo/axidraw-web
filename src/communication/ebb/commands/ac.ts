import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'AC';

export default createCommand(
  cmd,
  'Analog configure',
  function* (channel: number, enable: number) {
    const dataIn = yield `${cmd},${[channel, enable].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number] => {
    const [channel, enable] = params.split(',').map((p) => parseInt(p, 10));
    return [channel, enable];
  },
  {
    version: '2.2.3',
  },
);
