import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'ST';

export default createCommand(
  cmd,
  'Set EBB nickname tag',
  function* (tag: string) {
    const dataIn = yield `${cmd},${tag}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [string] => {
    return [params];
  },
  {
    version: '2.5.5',
  },
);
