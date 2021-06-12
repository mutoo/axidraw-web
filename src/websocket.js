import { checkVersion, decode, handleErrorMessage } from './ebb/utils.js';
import v from './ebb/commands/v.js';

let device;
let version = '0.0.0';

const commandQueue = [];

export const checkDevice = () => {
  if (!device) {
    throw new Error('Device is not connected');
  }
  if (device.readyState !== 1) {
    throw new Error('Device is not ready.');
  }
};

export const sendToDevice = async (msg) => {
  // eslint-disable-next-line no-console
  console.debug('Send to device: ', msg);
  device.send(msg);
};

export const executeCommand = async (command, ...params) => {
  checkDevice();
  if (command.version) {
    if (!checkVersion(version, command.version)) {
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
  // otherwise queues this command and waiting msg from device.
  return new Promise((resolve, reject) => {
    cmd.resolve = resolve;
    cmd.reject = reject;
  });
};

export const connectDevice = async (address) => {
  if (!window.WebSocket) {
    throw new Error('WebSocket feature is not supported in this browser!');
  }
  if (!device) {
    device = await new Promise((resolve) => {
      let buffer = [];
      let errorHandler = null;
      const ws = new WebSocket(address);
      ws.binaryType = 'arraybuffer';
      ws.onmessage = (event) => {
        const response = event.data;
        if (response === '!connected') {
          resolve(ws);
          return;
        }
        buffer.push(...new Uint8Array(response));
        while (buffer.length) {
          if (commandQueue.length) {
            if (buffer[0] === '!'.charCodeAt(0)) {
              if (!errorHandler) {
                errorHandler = handleErrorMessage();
                errorHandler.next(); // set ready
              }
            }
            const cmd = commandQueue[0];
            const handler = errorHandler || cmd;
            // pass the current buffer to cmd,
            // and let it consume what it needs.
            const cmdStatus = handler.next(buffer);
            const { result, consumed } = cmdStatus.value;
            if (consumed) {
              buffer = buffer.slice(consumed);
            }
            if (cmdStatus.done) {
              if (handler === errorHandler) {
                errorHandler = null;
                cmd.reject(result);
              } else {
                // eslint-disable-next-line no-console
                console.debug(`Received message: ${result}`);
                cmd.resolve(result);
              }
              commandQueue.shift();
            }
          } else {
            const garbage = decode(buffer);
            // eslint-disable-next-line no-console
            console.debug(`Discard garbage message: ${garbage}`);
            buffer.length = 0;
          }
        }
      };
      ws.onclose = (e) => {
        // eslint-disable-next-line no-console
        console.debug(`Device is closed: [${e.code}]${e.reason}`);
        device = null;
      };
    });
  }

  const ret = await executeCommand(v);
  // eslint-disable-next-line prefer-destructuring
  version = ret.match(/\d\.\d\.\d/)[0];
  return version;
};

export const disconnectDevice = async () => {
  checkDevice();
  // eslint-disable-next-line no-console
  console.debug('Closing device...');
  device.close();
  device = null;
  version = null;
  commandQueue.length = 0;
  // eslint-disable-next-line no-console
  console.debug('Device is closed');
};
