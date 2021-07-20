import EventEmitter from 'events';
import Logger from 'js-logger';
import { checkVersion } from '../ebb/utils';
import v from '../ebb/commands/v';
import r from '../ebb/commands/r';
import { DEVICE_EVENT_CONNECTED, DEVICE_EVENT_DISCONNECTED } from './consts';
import { timeout } from '../../utils/time';

export const logger = Logger.get('device');

export const executeCommand = async (
  deviceVersion,
  sendToDevice,
  commandQueue,
  command,
  ...params
) => {
  if (!command) {
    throw new Error(`Invalid command.`);
  }
  if (command.version) {
    if (!checkVersion(deviceVersion, command.version)) {
      throw new Error(
        `"${command.title}" command expects higher firmware version: ${command.version}.`,
      );
    }
  }
  const cmd = command.create(...params);
  const cmdStatus = cmd.next();
  await sendToDevice(cmdStatus.value);
  // if that command is done without taking any response, resolve it immediately.
  if (cmdStatus.done) return Promise.resolve();
  // otherwise queues this command and waiting msg from communication.device.
  return Promise.race([
    new Promise((resolve, reject) => {
      commandQueue.push({ resolve, reject, parser: cmd });
    }),
    timeout(60000, `EBB Command timeout: ${command.cmd}`),
  ]);
};

export const selectFirstDevice = async (devices) => {
  return devices[0];
};

export const createDeviceImpl = ({
  isReady,
  checkStatus,
  send,
  disconnect,
  onDisconnected,
}) => {
  return {
    isReady,
    checkStatus,
    send,
    disconnect,
    onDisconnected,
  };
};

export const createDeviceBind = ({ type, connectDevice }) => {
  let device = null;
  let version = '';
  const emitter = new EventEmitter();
  const commandQueue = [];
  const executedCommandBind = async (cmd, ...params) => {
    if (!device) throw new Error('Device is not connected yet');
    device.checkStatus();
    return executeCommand(
      version,
      (msg) => device.send(msg),
      commandQueue,
      cmd,
      ...params,
    );
  };
  const connectDeviceBind = async (...args) => {
    if (!device?.isReady) {
      // this will create a new device instance
      device = await connectDevice(commandQueue, ...args);
      device.onDisconnected((e) => {
        commandQueue.length = 0;
        device = null;
        version = '';
        emitter.emit(DEVICE_EVENT_DISCONNECTED, e);
      });
      await executedCommandBind(r);
      const versionResp = await executedCommandBind(v);
      // eslint-disable-next-line prefer-destructuring
      version = versionResp.match(/\d\.\d\.\d/)[0];
      emitter.emit(DEVICE_EVENT_CONNECTED);
    }
  };
  const disconnectDeviceBind = async () => {
    if (device?.isReady) {
      await device.disconnect();
    }
  };
  return {
    connectDevice: connectDeviceBind,
    disconnectDevice: disconnectDeviceBind,
    executeCommand: executedCommandBind,
    on(event, listener) {
      emitter.on(event, listener);
    },
    off(event, listener) {
      emitter.off(event, listener);
    },
    get type() {
      return type;
    },
    get version() {
      return version;
    },
    get isConnected() {
      return device?.isReady;
    },
  };
};
