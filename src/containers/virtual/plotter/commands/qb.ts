import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';

export const cmd = 'QB';

export default CreateCommand(
  'QB',
  'Query button',
  // eslint-disable-next-line @typescript-eslint/require-await
  async function* (context: VirtualPlotterContext) {
    const previousPRG = context.PRG;
    context.PRG = 0;
    yield `${previousPRG}\r\n${ENDING_OK_CR_NL}`;
    return;
  },
);
