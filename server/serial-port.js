import SerialPort from 'serialport';
import { delay } from './utils';

export const AXIDRAW_VENDOR_ID = '04d8';
export const AXIDRAW_PRODUCT_ID = 'fd92';

export const listDevices = async () => {
  const ports = await SerialPort.list();
  return ports.filter(
    (port) =>
      port.vendorId?.toLowerCase() === AXIDRAW_VENDOR_ID &&
      port.productId?.toLowerCase() === AXIDRAW_PRODUCT_ID,
  );
};

export const waitForEBB = async (deviceId, retry = 10) => {
  let retried = 0;
  while (retried < retry) {
    // eslint-disable-next-line no-await-in-loop
    const EBBs = await listDevices();
    const device = EBBs.find((ebb) => ebb.path === deviceId);
    if (device) {
      return deviceId;
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
export const connectToDevice = async (deviceId, dataHandler) => {
  const path = await waitForEBB(deviceId, 10);
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
