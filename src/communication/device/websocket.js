import EventEmitter from 'events';
import handleEBBMessages from '../ebb/messages/ebb';
import { createDeviceBind, createDeviceImpl, logger } from './utils';
import {
  DEVICE_EVENT_DISCONNECTED,
  DEVICE_TYPE_WEBSOCKET,
  WEBSOCKET_EVENT_CONNECTED,
  WEBSOCKET_EVENT_DISCONNECTED,
  WEBSOCKET_EVENT_MESSAGE,
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
        emitter.emit(WEBSOCKET_EVENT_CONNECTED);
        break;
      case 'ebb':
        emitter.emit(
          WEBSOCKET_EVENT_MESSAGE,
          Uint8Array.from(message.resp.data),
        );
        break;
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  };
  ws.onerror = () => {
    emitter.emit(WEBSOCKET_EVENT_DISCONNECTED, 'Host is not available.');
  };
  ws.onclose = (e) => {
    logger.debug(`Device is closed: [${e.code}]${e.reason}`);
    proxyStatus = WEBSOCKET_STATUS_DISCONNECTED;
    switch (e.code) {
      case 3000:
        emitter.emit(
          WEBSOCKET_EVENT_DISCONNECTED,
          'Forbidden: password is incorrect.',
        );
        break;
      case 3001:
        emitter.emit(
          WEBSOCKET_EVENT_DISCONNECTED,
          `Device is not available. ${e.reason}`,
        );
        break;
      case 3002:
        emitter.emit(WEBSOCKET_EVENT_DISCONNECTED, 'Device is not connected.');
        break;
      case 3003:
        emitter.emit(WEBSOCKET_EVENT_DISCONNECTED, 'Unknown message type.');
        break;
      case 3004:
        emitter.emit(WEBSOCKET_EVENT_DISCONNECTED, 'Disconnect from client.');
        break;
      case 3005:
        emitter.emit(WEBSOCKET_EVENT_DISCONNECTED, 'Server internal error.');
        break;
      case 1006:
        emitter.emit(WEBSOCKET_EVENT_DISCONNECTED, 'Disconnect from server.');
        break;
      default:
        emitter.emit(WEBSOCKET_EVENT_DISCONNECTED, e.reason);
    }
  };
  return {
    onConnected(listener) {
      emitter.on(WEBSOCKET_EVENT_CONNECTED, listener);
    },
    onMessage(listener) {
      emitter.on(WEBSOCKET_EVENT_MESSAGE, listener);
    },
    onDisconnected(listener) {
      emitter.on(WEBSOCKET_EVENT_DISCONNECTED, listener);
    },
    send(message) {
      wsSend({ type: 'command', command: message });
    },
    close() {
      ws.close(3004);
    },
    get status() {
      return proxyStatus;
    },
  };
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
      const emitter = new EventEmitter();
      proxy.onConnected(() => {
        resolve(
          createDeviceImpl({
            get isReady() {
              return proxy.status === WEBSOCKET_STATUS_STANDBY;
            },
            checkStatus() {
              if (proxy.status !== WEBSOCKET_STATUS_STANDBY) {
                throw new Error('Device is not ready.');
              }
            },
            send(message) {
              logger.debug(`Send to communication.device: ${message}`);
              proxy.send(message);
            },
            disconnect() {
              proxy.close();
            },
            onDisconnected(listener) {
              emitter.on(DEVICE_EVENT_DISCONNECTED, listener);
            },
          }),
        );
      });
      proxy.onMessage((message) => {
        messageHandler.next(message);
      });
      proxy.onDisconnected((e) => {
        messageHandler.return();
        emitter.emit(DEVICE_EVENT_DISCONNECTED, e);
        logger.debug('Device is closed', e);
        reject(e);
      });
    });
  };

export default function createWSDevice({ devicePicker }) {
  return createDeviceBind({
    type: DEVICE_TYPE_WEBSOCKET,
    connectDevice: connectDevice({ devicePicker }),
  });
}
