import EventEmitter from 'events';
import { createDeviceBind, createDeviceImpl, logger } from './utils';
import {
  DEVICE_EVENT_DISCONNECTED,
  DEVICE_TYPE_VIRTUAL,
  VIRTUAL_EVENT_CONNECTED,
  VIRTUAL_EVENT_DISCONNECTED,
  VIRTUAL_EVENT_MESSAGE,
  VIRTUAL_EVENT_STARTED,
  VIRTUAL_STATUS_CONNECTED,
  VIRTUAL_STATUS_DISCONNECTED,
} from './consts';
import handleEBBMessages from '../ebb/messages/ebb';
import { encode } from '../ebb/utils';

export const createVirtualDeviceProxy = ({ version }) => {
  const emitter = new EventEmitter();
  const proxy = window.open(
    `virtual.html?ebb=${version}`,
    '_blank',
    'popup=1,width=800,height=600',
  );
  let proxyStatus = VIRTUAL_STATUS_DISCONNECTED;
  const onMessage = (event) => {
    if (event.source !== proxy) {
      return;
    }
    switch (event.data.type) {
      case VIRTUAL_EVENT_STARTED:
        proxyStatus = VIRTUAL_STATUS_CONNECTED;
        emitter.emit(VIRTUAL_EVENT_CONNECTED);
        break;
      case VIRTUAL_EVENT_MESSAGE:
        emitter.emit(VIRTUAL_EVENT_MESSAGE, encode(event.data.data));
        break;
      case VIRTUAL_EVENT_DISCONNECTED:
        proxyStatus = VIRTUAL_STATUS_DISCONNECTED;
        emitter.emit(VIRTUAL_EVENT_DISCONNECTED);
        window.removeEventListener('message', onMessage);
        break;
      default:
      // ignore
    }
  };
  window.addEventListener('message', onMessage);
  return {
    onConnected(listener) {
      emitter.on(VIRTUAL_EVENT_CONNECTED, listener);
    },
    onMessage(listener) {
      emitter.on(VIRTUAL_EVENT_MESSAGE, listener);
    },
    onDisconnected(listener) {
      emitter.on(VIRTUAL_EVENT_DISCONNECTED, listener);
    },
    send(message) {
      proxy.postMessage({ type: 'command', command: message });
    },
    close() {
      proxyStatus = VIRTUAL_STATUS_DISCONNECTED;
      proxy.postMessage({ type: VIRTUAL_EVENT_DISCONNECTED });
    },
    get status() {
      return proxyStatus;
    },
  };
};

export const connectDevice = () => async (commandQueue, version) => {
  return new Promise((resolve, reject) => {
    const messageHandler = handleEBBMessages(commandQueue);
    messageHandler.next();
    const proxy = createVirtualDeviceProxy({ version });
    const emitter = new EventEmitter();
    proxy.onConnected(() => {
      resolve(
        createDeviceImpl({
          get isReady() {
            return proxy.status === VIRTUAL_STATUS_CONNECTED;
          },
          checkStatus() {
            if (proxy.status !== VIRTUAL_STATUS_CONNECTED) {
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

export default function createVirtualDevice() {
  return createDeviceBind({
    type: DEVICE_TYPE_VIRTUAL,
    connectDevice: connectDevice(),
  });
}
