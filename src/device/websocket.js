import { handleEBBMessages } from '../ebb/utils.js';
import { createDeviceBind } from './utils.js';
import { DEVICE_TYPE_WEBSOCKET } from './consts.js';

export const checkDevice = (device) => {
  if (!device) {
    throw new Error('Device is not connected');
  }
  if (device.readyState !== 1) {
    throw new Error('Device is not ready.');
  }
};

export const sendToDevice = async (device, msg) => {
  // eslint-disable-next-line no-console
  console.debug('Send to device: ', msg);
  device.send(msg);
};

export const connectDevice = async (commandQueue, address) => {
  if (!window.WebSocket) {
    throw new Error('WebSocket feature is not supported in this browser!');
  }
  return new Promise((resolve) => {
    const messageHandler = handleEBBMessages(commandQueue);
    messageHandler.next();
    const ws = new WebSocket(address);
    ws.binaryType = 'arraybuffer';
    ws.onmessage = (event) => {
      const message = event.data;
      if (message === '!connected') {
        resolve(ws);
        return;
      }
      messageHandler.next(message);
    };
    ws.onclose = (e) => {
      // eslint-disable-next-line no-console
      console.debug(`Device is closed: [${e.code}]${e.reason}`);
      messageHandler.return();
    };
  });
};

export const disconnectDevice = async (device) => {
  device.close();
  // eslint-disable-next-line no-console
  console.debug('Device is closed');
};

export default function createWSDevice() {
  return createDeviceBind({
    type: DEVICE_TYPE_WEBSOCKET,
    connectDevice,
    disconnectDevice,
    checkDevice,
    sendToDevice,
  });
}
