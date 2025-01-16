import { CommandGenerator, createCommand } from '../command';
import { decode, noParameters } from '../utils';

export const cmd = 'RB';

export default createCommand(
  cmd,
  'Reboot',
  function* (): CommandGenerator<null> {
    const dataIn = yield 'RB\r';
    // no data returned
    return {
      consumed: 0,
      remain: decode(dataIn),
      result: null,
    };
  },
  noParameters,
  {
    version: '2.5.4',
  },
);
