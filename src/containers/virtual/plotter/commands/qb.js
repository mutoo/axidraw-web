import { ENDING_OK_CR_NL } from 'communication/ebb/constants';

export const cmd = 'QB';

export default {
  cmd,
  title: 'Query button',
  async *create(context) {
    const previousPRG = context.PRG;
    context.PRG = 0;
    return `${previousPRG}\r\n${ENDING_OK_CR_NL}`;
  },
};
