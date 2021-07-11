import EventEmitter from 'events';
import handleEBBMessages from '../ebb/messages/ebb';
import { createDeviceBind } from './utils';
import {
  DEVICE_TYPE_WEBSOCKET,
  WEBSOCKET_STATUS_AUTHORIZED,
  WEBSOCKET_STATUS_CONNECTED,
  WEBSOCKET_STATUS_DISCONNECTED,
  WEBSOCKET_STATUS_STANDBY,
} from './consts';

export const createWSDeviceProxy = (address, auth, devicePicker) => {
  const emitter = new EventEmitter();
  const ws = new WebSocket(address);
  let proxyStatus = WEBSOCKET_STATUS_DISCONNECTED;
  ws.binaryType = 'arraybuffer';
  const wsSend = (data) => {
    ws.send(JSON.stringify(data));
  };
  ws.onopen = () => {
    proxyStatus = WEBSOCKET_STATUS_CONNECTED;
    wsSend({ type: 'auth', code: auth });
  };
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    switch (message.type) {
      case 'devices':
        proxyStatus = WEBSOCKET_STATUS_AUTHORIZED;
        devicePicker(message.devices).then((device) => {
          wsSend({ type: 'device_id', device: device.path });
        });
        break;
      case 'ready':
        proxyStatus = WEBSOCKET_STATUS_STANDBY;
        emitter.emit('connected');
        break;
      case 'ebb':
        emitter.emit('message', Uint8Array.from(message.resp.data));
        break;
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  };
  ws.onclose = (e) => {
    // eslint-disable-next-line no-console
    console.debug(`Device is closed: [${e.code}]${e.reason}`);
    proxyStatus = WEBSOCKET_STATUS_DISCONNECTED;
    switch (e.code) {
      case 3000:
        emitter.emit('close', 'Forbidden: password is incorrect.');
        break;
      case 3001:
        emitter.emit('close', `Device is not available. ${e.reason}`);
        break;
      case 3002:
        emitter.emit('close', 'Device is not connected.');
        break;
      case 3003:
        emitter.emit('close', 'Unknown message type.');
        break;
      case 1006:
        emitter.emit('close', 'Host is not found.');
        break;
      default:
        emitter.emit('close', e.reason);
    }
  };
  return {
    on(...args) {
      emitter.on(...args);
    },
    send(message) {
      wsSend({ type: 'command', command: message });
    },
    close() {
      ws.close();
    },
    get status() {
      return proxyStatus;
    },
  };
};

export const checkDevice = (device) => {
  if (!device) {
    throw new Error('Device is not connected');
  }
  if (device.status !== WEBSOCKET_STATUS_STANDBY) {
    throw new Error('Device is not ready.');
  }
};

export const sendToDevice = async (device, msg) => {
  // eslint-disable-next-line no-console
  console.debug('Send to communication.device: ', msg);
  device.send(msg);
};

export const connectDevice =
  ({ devicePicker }) =>
  async (commandQueue, address, auth) => {
    if (!window.WebSocket) {
      throw new Error('WebSocket feature is not supported in this browser!');
    }
    return new Promise((resolve, reject) => {
      const messageHandler = handleEBBMessages(commandQueue);
      messageHandler.next();
      const proxy = createWSDeviceProxy(address, auth, devicePicker);
      proxy.on('connected', () => {
        resolve(proxy);
      });
      proxy.on('message', (message) => {
        messageHandler.next(message);
      });
      proxy.on('close', (e) => {
        messageHandler.return();
        reject(e);
      });
    });
  };

export const disconnectDevice = async (device) => {
  device.close();
  // eslint-disable-next-line no-console
  console.debug('Device is closed');
};

export default function createWSDevice({ devicePicker }) {
  return createDeviceBind({
    type: DEVICE_TYPE_WEBSOCKET,
    connectDevice: connectDevice({ devicePicker }),
    disconnectDevice,
    checkDevice,
    sendToDevice,
  });
}
