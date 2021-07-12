import { checkVersion } from '../ebb/utils';
import v from '../ebb/commands/v';

export const executeCommand = async (
  deviceVersion,
  sendToDevice,
  commandQueue,
  command,
  ...params
) => {
  if (!command) {
    throw new Error(`Invalid command`);
  }
  if (command.version) {
    if (!checkVersion(deviceVersion, command.version)) {
      throw new Error(
        `${command.name} Command expects higher firmware version: ${command.version}`,
      );
    }
  }
  const cmd = command.create(...params);
  const cmdStatus = cmd.next();
  await sendToDevice(cmdStatus.value);
  // if that command is done without taking any response, resolve it immediately.
  if (cmdStatus.done) return Promise.resolve();
  commandQueue.push(cmd);
  // otherwise queues this command and waiting msg from communication.device.
  return new Promise((resolve, reject) => {
    cmd.resolve = resolve;
    cmd.reject = reject;
  });
};

export const selectFirstDevice = async (devices) => {
  return devices[0];
};

export const createDeviceBind = ({
  type,
  connectDevice,
  disconnectDevice,
  sendToDevice,
  checkDevice,
}) => {
  let device = null;
  let version = '';
  const commandQueue = [];
  const sendToDeviceBind = (msg) => sendToDevice(device, msg);
  const checkDeviceBind = () => checkDevice(device);
  const executedCommandBind = async (cmd, ...params) => {
    await checkDeviceBind();
    return executeCommand(
      version,
      sendToDeviceBind,
      commandQueue,
      cmd,
      ...params,
    );
  };
  const connectDeviceBind = async (...args) => {
    if (!device) {
      device = await connectDevice(commandQueue, ...args);
      const ret = await executedCommandBind(v);
      // eslint-disable-next-line prefer-destructuring
      version = ret.match(/\d\.\d\.\d/)[0];
    }
  };
  const disconnectDeviceBind = async () => {
    if (device) {
      await disconnectDevice(device);
    }
    commandQueue.length = 0;
    device = null;
    version = '';
  };
  return {
    type,
    sendToDevice: sendToDeviceBind,
    checkDevice: checkDeviceBind,
    executeCommand: executedCommandBind,
    connectDevice: connectDeviceBind,
    disconnectDevice: disconnectDeviceBind,
    get version() {
      return version;
    },
    get isConnected() {
      return !!version;
    },
  };
};
