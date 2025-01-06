import { ENDING_OK_CR_NL } from 'communication/ebb/constants';
import { runInAction } from 'mobx';

export const cmd = 'EM';

export default {
  cmd,
  title: 'Enable motors',
  async *create(context, m1, m2) {
    runInAction(() => {
      if (m1 === '0') {
        context.motor.m1 = 0;
      } else {
        context.motor.m1 = parseInt(m1, 10);
        context.motor.m2 = parseInt(m1, 10); // m2 will be set to whatever m1 set
      }
      if (m2 === '0') {
        context.motor.m2 = 0;
      }
    });
    return ENDING_OK_CR_NL;
  },
};
