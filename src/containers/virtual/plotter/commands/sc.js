import { ENDING_OK_CR_NL } from 'communication/ebb/constants';

export const cmd = 'SC';

export default {
  cmd,
  title: 'Stepper and Servo mode configure',
  async *create(context, key, value) {
    switch (key) {
      case '4':
        context.servo.min = value;
        break;
      case '5':
        context.servo.max = value;
        break;
      case '10':
        context.servo.rate = value;
        break;
      default:
    }
    return ENDING_OK_CR_NL;
  },
};
