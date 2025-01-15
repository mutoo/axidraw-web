import EventEmitter from 'events';
import handleEBBMessages from '../ebb/messages/ebb';
import { encode } from '../ebb/utils';
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
import { IDevice } from './device';
import { createDeviceBind, logger, PendingCommand } from './utils';

type VMMessage = {
  type: string;
  data: string;
};

export const createVirtualDeviceProxy = ({ version }: { version: string }) => {
  const emitter = new EventEmitter();
  const proxy = window.open(
    `virtual.html?ebb=${version}`,
    '_blank',
    'popup=1,width=1024,height=768',
  );
  let proxyStatus = VIRTUAL_STATUS_DISCONNECTED;
  const onMessage = (event: MessageEvent<VMMessage>) => {
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
    onConnected(listener: () => void) {
      emitter.on(VIRTUAL_EVENT_CONNECTED, listener);
    },
    onMessage(listener: (data: ArrayBufferLike) => void) {
      emitter.on(VIRTUAL_EVENT_MESSAGE, listener);
    },
    onDisconnected(listener: (reason: string) => void) {
      emitter.on(VIRTUAL_EVENT_DISCONNECTED, listener);
    },
    send(message: string) {
      proxy?.postMessage({ type: 'command', command: message });
    },
    close() {
      proxyStatus = VIRTUAL_STATUS_DISCONNECTED;
      proxy?.postMessage({ type: VIRTUAL_EVENT_DISCONNECTED });
    },
    get status() {
      return proxyStatus;
    },
  };
};

export const connectDevice =
  () =>
  async (
    commandQueue: PendingCommand<unknown>[],
    config: { version: string },
  ): Promise<IDevice> => {
    return new Promise((resolve, reject) => {
      const messageHandler = handleEBBMessages(commandQueue);
      messageHandler.next();
      const { version } = config;
      const proxy = createVirtualDeviceProxy({ version });
      const emitter = new EventEmitter();
      proxy.onConnected(() => {
        resolve({
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
        } as IDevice);
      });
      proxy.onMessage((message: ArrayBufferLike) => {
        messageHandler.next(message);
      });
      proxy.onDisconnected((e: string) => {
        messageHandler.return();
        emitter.emit(DEVICE_EVENT_DISCONNECTED, e);
        logger.debug('Device is closed', e);
        reject(new Error(e));
      });
    });
  };

export default function createVirtualDevice() {
  return createDeviceBind({
    type: DEVICE_TYPE_VIRTUAL,
    connectDevice: connectDevice(),
  });
}
