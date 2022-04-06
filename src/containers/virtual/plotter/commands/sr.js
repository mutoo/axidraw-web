import { ENDING_OK_CR_NL } from 'communication/ebb/constants';

export const cmd = 'SR';

export default {
  cmd,
  title: 'Set RC Servo power timeout',
  async *create() {
    return ENDING_OK_CR_NL;
  },
};
