// eslint-disable-next-line no-unused-vars
import { createCommand } from '../utils';

export const cmd = 'RB';

export default createCommand(
  cmd,
  'Reboot',
  function* () {
    return 'RB\r';
    // no data returned
  },
  {
    version: '2.5.4',
  },
);
