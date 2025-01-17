import EventEmitter from 'events';
import Logger from 'js-logger';
import { timeout } from '@/utils/time';
import { Command, CommandGenerator } from '../ebb/command';
import r from '../ebb/commands/r';
import v from '../ebb/commands/v';
import { checkVersion } from '../ebb/utils';
import { DEVICE_EVENT_CONNECTED, DEVICE_EVENT_DISCONNECTED } from './consts';
import { IDevice, IDeviceConnector } from './device';
import { WSDevice } from './websocket';

export const logger = Logger.get('device');

export type PendingCommand<T> = {
  resolve: (result: T) => void;
  reject: (reason: string) => void;
  parser: CommandGenerator<T>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const executeCommand = async <T extends any[], R>(
  deviceVersion: string,
  sendToDevice: (msg: string) => Promise<void>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commandQueue: PendingCommand<any>[],
  command: Command<T, R>,
  ...params: T
): Promise<R> => {
  if (command.version) {
    if (!checkVersion(deviceVersion, command.version)) {
      throw new Error(
        `"${command.title}" command expects higher firmware version: ${command.version}.`,
      );
    }
  }
  const cmd = command.create(...params);
  const cmdStatus = cmd.next();
  // kick off the command, this should always yield a command.
  await sendToDevice(cmdStatus.value as string);
  // if that command is done without taking any response, resolve it immediately.
  if (cmdStatus.done) return Promise.resolve(cmdStatus.value.result);
  // otherwise queues this command and waiting msg from communication.device.
  return Promise.race([
    new Promise<R>((resolve, reject) => {
      commandQueue.push({ resolve, reject, parser: cmd });
    }),
    timeout(60000, `EBB Command timeout: ${command.cmd}`) as Promise<R>,
  ]);
};

export const selectFirstDevice = (devices: (USBDevice | WSDevice)[]) => {
  return Promise.resolve(devices[0]);
};

export const createDeviceBind = <C>({
  type,
  connectDevice,
}: {
  type: string;
  connectDevice: (
    commandQueue: PendingCommand<unknown>[],
    config: C,
  ) => Promise<IDevice>;
}): IDeviceConnector<C> => {
  let device: IDevice | null = null;
  let version = '';
  const emitter = new EventEmitter();
  const commandQueue: PendingCommand<unknown>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executedCommandBind = async <T extends any[], R>(
    cmd: Command<T, R>,
    ...params: T
  ): Promise<R> => {
    if (!device) throw new Error('Device is not connected yet');
    device.checkStatus(); // ensure the device is ready
    return executeCommand<T, R>(
      version,
      (msg) => device!.send(msg),
      commandQueue,
      cmd,
      ...params,
    );
  };
  const connectDeviceBind = async (config: C) => {
    if (!device?.isReady) {
      // this will create a new device instance
      device = await connectDevice(commandQueue, config);
      device.onDisconnected((e: string) => {
        commandQueue.length = 0;
        device = null;
        version = '';
        emitter.emit(DEVICE_EVENT_DISCONNECTED, e);
      });
      await executedCommandBind(r);
      const versionResp = await executedCommandBind(v);
      version = versionResp.match(/\d\.\d\.\d/)![0];
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
    on(event: string, listener: (...args: unknown[]) => void) {
      emitter.on(event, listener);
    },
    off(event: string, listener: (...args: unknown[]) => void) {
      emitter.off(event, listener);
    },
    get type() {
      return type;
    },
    get version() {
      return version;
    },
    get isConnected() {
      return device?.isReady ?? false;
    },
  };
};
