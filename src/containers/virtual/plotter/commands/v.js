export const cmd = 'V';

export default {
  cmd,
  title: 'Version',
  async *create(context) {
    return `EBBv13_and_above EB Firmware Version ${context.version}\r\n`;
  },
};
