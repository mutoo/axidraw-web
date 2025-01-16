import { CreateCommand } from '../command';

export default CreateCommand(
  'V',
  'Version',
  // eslint-disable-next-line @typescript-eslint/require-await
  async function* (context) {
    yield `EBBv13_and_above EB Firmware Version ${context.version}\r\n`;
    return;
  },
);
