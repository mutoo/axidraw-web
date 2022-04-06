import { ENDING_OK_CR_NL } from 'communication/ebb/constants';

export const cmd = 'QS';

export default {
  cmd,
  title: 'Query step position',
  async *create(context) {
    const { a1, a2 } = context.motor;
    return `${a1},${a2}\n\r${ENDING_OK_CR_NL}`;
  },
};
