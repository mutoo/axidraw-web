import EventEmitter from 'events';
import handleEBBMessages from '../ebb/messages/ebb';
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
import { DevicePicker, IDevice } from './device';
import { createDeviceBind, logger, PendingCommand } from './utils';

export type WSDevice = { path: string };
type ServerMessage =
  | { type: 'ready' }
  | {
      type: 'devices';
      devices: WSDevice[];
    }
  | { type: 'ebb'; resp: { data: number[] } };

export const createWSDeviceProxy = (
  address: string,
  auth: string,
  devicePicker: DevicePicker<WSDevice>,
) => {
  const emitter = new EventEmitter();
  const ws = new WebSocket(address);
  let proxyStatus = WEBSOCKET_STATUS_DISCONNECTED;
  ws.binaryType = 'arraybuffer';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsSend = (data: any) => {
    ws.send(JSON.stringify(data));
  };
  ws.onopen = () => {
    proxyStatus = WEBSOCKET_STATUS_CONNECTED;
    wsSend({ type: 'auth', code: auth });
  };
  ws.onmessage = (event: MessageEvent<ServerMessage>) => {
    const message = JSON.parse(
      event.data as unknown as string,
    ) as ServerMessage;
    switch (message.type) {
      case 'devices':
        proxyStatus = WEBSOCKET_STATUS_AUTHORIZED;
        void devicePicker(message.devices).then((device) => {
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
        throw new Error(`Unknown message type: ${String(message)}`);
    }
  };
  ws.onerror = () => {
    emitter.emit(WEBSOCKET_EVENT_DISCONNECTED, 'Host is not available.');
  };
  ws.onclose = (e: CloseEvent) => {
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
    onConnected(listener: () => void) {
      emitter.on(WEBSOCKET_EVENT_CONNECTED, listener);
    },
    onMessage(listener: (data: ArrayBufferLike) => void) {
      emitter.on(WEBSOCKET_EVENT_MESSAGE, listener);
    },
    onDisconnected(listener: (reason: string) => void) {
      emitter.on(WEBSOCKET_EVENT_DISCONNECTED, listener);
    },
    send(message: string) {
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
  ({ devicePicker }: { devicePicker: DevicePicker<WSDevice> }) =>
  async (
    commandQueue: PendingCommand<unknown>[],
    config: { address: string; auth: string },
  ): Promise<IDevice> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!window.WebSocket) {
      throw new Error('WebSocket feature is not supported in this browser!');
    }
    return new Promise((resolve, reject) => {
      const messageHandler = handleEBBMessages(commandQueue);
      messageHandler.next();
      const { address, auth } = config;
      const proxy = createWSDeviceProxy(address, auth, devicePicker);
      const emitter = new EventEmitter();
      proxy.onConnected(() => {
        resolve({
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

export default function createWSDevice({
  devicePicker,
}: {
  devicePicker: DevicePicker<WSDevice>;
}) {
  return createDeviceBind({
    type: DEVICE_TYPE_WEBSOCKET,
    connectDevice: connectDevice({ devicePicker }),
  });
}
