import { ENDING_OK_CR_NL } from 'communication/ebb/constants';

export const cmd = 'R';

export default {
  cmd,
  title: 'Reset',
  async *create() {
    return ENDING_OK_CR_NL + ENDING_OK_CR_NL;
  },
};
