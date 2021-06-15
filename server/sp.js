import SerialPort from 'serialport';
import { delay } from '../src/utils/time.js';

const waitForEBB = async (retry = 10) => {
  let retried = 0;
  while (retried < retry) {
    // eslint-disable-next-line no-await-in-loop
    const ports = await SerialPort.list();
    const EBBs = ports.filter(
      (port) =>
        port.vendorId?.toLowerCase() === '04d8' &&
        port.productId?.toLowerCase() === 'fd92',
    );
    if (EBBs.length) {
      return EBBs[0].path;
    }
    // eslint-disable-next-line no-console
    console.log('EBB not found, will retry in 3s...');
    // eslint-disable-next-line no-await-in-loop
    await delay(3000);
    retried += 1;
  }
  throw new Error('Device not available right now.');
};

// eslint-disable-next-line import/prefer-default-export
export const connectToDevice = async (dataHandler) => {
  const path = await waitForEBB(10);
  return new Promise((resolve, reject) => {
    const port = new SerialPort(path);
    port.on('open', () => {
      // eslint-disable-next-line no-console
      console.log(`Connected to port: ${path}`);
      resolve(port);
    });
    port.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.log(`Can not connect to port: ${err}`);
      reject(err);
    });
    port.on('data', dataHandler);
  });
};
