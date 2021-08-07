import EventEmitter from 'events';
import { encode } from '../ebb/utils';
import handleEBBMessages from '../ebb/messages/ebb';
import { createDeviceBind, createDeviceImpl, logger } from './utils';
import { DEVICE_EVENT_DISCONNECTED, DEVICE_TYPE_USB } from './consts';

export const TRANSFER_ENDPOINT = 2;
export const TRANSFER_PACKET_SIZE = 64;

export const connectDevice =
  ({ devicePicker }) =>
  async (commandQueue, pair = false) => {
    if (!navigator.usb) {
      throw new Error('WebUSB feature is not supported in this browser!');
    }
    let device;
    const emitter = new EventEmitter();
    const devices = await navigator.usb.getDevices();
    devices.forEach((p) => {
      logger.debug(`Found device: ${p.productName}`);
    });
    if (pair || !devices.length) {
      // select or pair device from native device picker
      device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x04d8, productId: 0xfd92 }],
      });
      if (!device) {
        throw new Error('No EBB communication.device available.');
      }
    } else {
      // select from paired devices
      device = await devicePicker(devices);
    }
    if (!device.opened) {
      logger.debug('Opening communication.device...');
      await device.open();
    }
    logger.debug('Selecting configuration..');
    await device.selectConfiguration(1);
    logger.debug('Claiming interface...');
    await device.claimInterface(1);
    // start listening the data transferred in
    setTimeout(async () => {
      logger.debug('Start listening data.');
      const messageHandler = handleEBBMessages(commandQueue);
      messageHandler.next();
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (!device?.opened) {
            logger.debug('Stop listening data.');
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
        messageHandler.return();
        logger.debug(e.message);
        emitter.emit(DEVICE_EVENT_DISCONNECTED, e.message);
      }
    });
    return createDeviceImpl({
      get isReady() {
        return (
          device?.configuration.interfaces.findIndex((i) => i.claimed) >= 0
        );
      },
      checkStatus() {
        if (!device.opened) {
          throw new Error('Device is not opened');
        }
        const claimedInterface = device.configuration.interfaces.find(
          (i) => i.claimed,
        );
        if (!claimedInterface) {
          throw new Error('Device interface is not claimed');
        }
      },
      async send(message) {
        logger.debug('Send to communication.device: ', message);
        const data = encode(message);
        const result = await device.transferOut(TRANSFER_ENDPOINT, data);
        if (result.status !== 'ok') {
          throw new Error('Can not sent command to communication.device.');
        }
      },
      async disconnect() {
        logger.debug('Closing communication.device...');
        // abort all pending data
        await device.reset();
        // close the device
        await device.close();
        logger.debug('Device is closed');
        // the disconnected event will be trigger from the message handler
      },
      onDisconnected(listener) {
        emitter.on(DEVICE_EVENT_DISCONNECTED, listener);
      },
    });
  };

export default function createUSBDevice({ devicePicker }) {
  return createDeviceBind({
    type: DEVICE_TYPE_USB,
    connectDevice: connectDevice({ devicePicker }),
  });
}
