import type { PortInfo } from '@serialport/bindings-interface';
import { SerialPort } from 'serialport';
import { delay } from './utils.ts';

export const AXIDRAW_VENDOR_ID = '04d8';
export const AXIDRAW_PRODUCT_ID = 'fd92';

export const listDevices = async () => {
  const ports: PortInfo[] = await SerialPort.list();
  return ports.filter(
    (port) =>
      port.vendorId?.toLowerCase() === AXIDRAW_VENDOR_ID &&
      port.productId?.toLowerCase() === AXIDRAW_PRODUCT_ID,
  );
};

export const waitForEBB = async (deviceId: string, retry = 10) => {
  let retried = 0;
  while (retried < retry) {
    const EBBs = await listDevices();
    const device = EBBs.find((ebb) => ebb.path === deviceId);
    if (device) {
      return deviceId;
    }

    console.log('EBB not found, will retry in 3s...');

    await delay(3000);
    retried += 1;
  }
  throw new Error('Device not available right now.');
};

export const connectToDevice = async (
  deviceId: string,
  dataHandler: (resp: Buffer) => void,
) => {
  const path = await waitForEBB(deviceId, 10);
  return new Promise<SerialPort>((resolve, reject) => {
    const port = new SerialPort({ path, baudRate: 9600 });
    port.on('open', () => {
      console.log(`Connected to port: ${path}`);
      resolve(port);
    });
    port.on('error', (err) => {
      console.log(`Can not connect to port: ${err}`);
      reject(err);
    });
    port.on('data', dataHandler);
  });
};
