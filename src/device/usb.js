import { encode, handleEBBMessages } from '../ebb/utils.js';
import { createDeviceBind } from './utils.js';
import { DEVICE_TYPE_USB } from './consts.js';

export const TRANSFER_ENDPOINT = 2;
export const TRANSFER_PACKET_SIZE = 64;

export const checkDevice = (device) => {
  if (!device) {
    throw new Error('Device is not connected');
  }
  if (!device.opened) {
    throw new Error('Device is not opened');
  }
  const claimedInterface = device.configuration.interfaces.find(
    (i) => i.claimed,
  );
  if (claimedInterface?.interfaceNumber !== 1) {
    throw new Error('Device interface is not claimed');
  }
};

export const sendToDevice = async (device, msg) => {
  // eslint-disable-next-line no-console
  console.debug('Send to device: ', msg);
  const data = encode(msg);
  const result = await device.transferOut(TRANSFER_ENDPOINT, data);
  if (result.status !== 'ok') {
    throw new Error('Can not sent command to device.');
  }
};

export const connectDevice = async (commandQueue, pair = false) => {
  if (!navigator.usb) {
    throw new Error('WebUSB feature is not supported in this browser!');
  }
  let device;
  const devices = await navigator.usb.getDevices();
  devices.forEach((p) => {
    // eslint-disable-next-line no-console
    console.log(`Found device: ${p.productName}`);
  });
  // select first available device
  if (pair || !devices.length) {
    device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x04d8, productId: 0xfd92 }],
    });
    if (!device) {
      throw new Error('No EBB device available.');
    }
  } else {
    // eslint-disable-next-line prefer-destructuring
    device = devices[0];
  }
  if (!device.opened) {
    // eslint-disable-next-line no-console
    console.debug('Opening device...');
    await device.open();
  }
  // eslint-disable-next-line no-console
  console.debug('Selecting configuration..');
  await device.selectConfiguration(1);
  // eslint-disable-next-line no-console
  console.debug('Claiming interface...');
  await device.claimInterface(1);
  // start listening the data transferred in
  setTimeout(async () => {
    // eslint-disable-next-line no-console
    console.debug('Start listening data.');
    const messageHandler = handleEBBMessages(commandQueue);
    messageHandler.next();
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (!device?.opened) {
          // eslint-disable-next-line no-console
          console.debug('Stop listening data.');
          break;
        }
        // eslint-disable-next-line no-await-in-loop
        const response = await device.transferIn(
          TRANSFER_ENDPOINT,
          TRANSFER_PACKET_SIZE,
        );
        if (response.status !== 'ok') {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
        messageHandler.next(response.data.buffer);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug(e.message);
      messageHandler.return();
    }
  });
  return device;
};

export const disconnectDevice = async (device) => {
  // eslint-disable-next-line no-console
  console.debug('Closing device...');
  await device.close();
  // eslint-disable-next-line no-console
  console.debug('Device is closed');
};

export default function createUSBDevice() {
  return createDeviceBind({
    type: DEVICE_TYPE_USB,
    connectDevice,
    disconnectDevice,
    checkDevice,
    sendToDevice,
  });
}
