import { checkVersion, decode, handleErrorMessage } from './ebb/utils.js';
import v from './ebb/commands/v.js';

const TRANSFER_ENDPOINT = 2;
const TRANSFER_PACKET_SIZE = 64;

let device;
let version = '2.7.0';

const commandQueue = [];
const encoder = new TextEncoder();

export const checkDevice = () => {
  if (!device) {
    throw new Error('Device is not connected');
  }
  if (!device.opened) {
    throw new Error('Device is not opened');
  }
  const claimedInterface = device.configuration.interfaces.find(
    (i) => i.claimed,
  );
  if (claimedInterface?.interfaceNumber !== 1) {
    throw new Error('Device interface is not claimed');
  }
};

export const sendToDevice = async (msg) => {
  const data = encoder.encode(msg);
  // eslint-disable-next-line no-console
  console.debug('Send to device: ', decode(data));
  const result = await device.transferOut(TRANSFER_ENDPOINT, data);
  if (result.status !== 'ok') {
    throw new Error('Can not sent command to device.');
  }
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

export const connectDevice = async (pair = false) => {
  if (!navigator.usb) {
    throw new Error('WebUSB feature is not supported in this browser!');
  }
  if (!device) {
    const devices = await navigator.usb.getDevices();
    devices.forEach((p) => {
      // eslint-disable-next-line no-console
      console.log(`Found device: ${p.productName}`);
    });
    // select first available device
    if (pair || !devices.length) {
      device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x04d8, productId: 0xfd92 }],
      });
      if (!device) {
        throw new Error('No EBB device available.');
      }
    } else {
      // eslint-disable-next-line prefer-destructuring
      device = devices[0];
    }
  }
  if (!device.opened) {
    // eslint-disable-next-line no-console
    console.debug('Opening device...');
    await device.open();
  }
  // eslint-disable-next-line no-console
  console.debug('Selecting configuration..');
  await device.selectConfiguration(1);
  // eslint-disable-next-line no-console
  console.debug('Claiming interface...');
  await device.claimInterface(1);

  // start listening the data transferred in
  setTimeout(async () => {
    // eslint-disable-next-line no-console
    console.debug('Start listening data.');
    let buffer = [];
    let errorHandler = null;
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (!device?.opened) {
          // eslint-disable-next-line no-console
          console.debug('Stop listening data.');
          break;
        }
        // eslint-disable-next-line no-await-in-loop
        const response = await device.transferIn(
          TRANSFER_ENDPOINT,
          TRANSFER_PACKET_SIZE,
        );
        if (response.status !== 'ok') {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
        buffer.push(...new Uint8Array(response.data.buffer));
        // data arrived
        while (buffer.length) {
          if (commandQueue.length) {
            if (buffer[0] === '!'.charCodeAt(0)) {
              if (!errorHandler) {
                errorHandler = handleErrorMessage();
                errorHandler.next(); // ready
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
      }
    } catch (e) {
      throw new Error(`Can not receive response from device: ${e.message}`);
    }
  });

  const ret = await executeCommand(v);
  // eslint-disable-next-line prefer-destructuring
  version = ret.match(/\d\.\d\.\d/)[0];
  return version;
};

export const disconnectDevice = async () => {
  checkDevice();
  // eslint-disable-next-line no-console
  console.debug('Closing device...');
  await device.close();
  device = null;
  version = null;
  commandQueue.length = 0;
  // eslint-disable-next-line no-console
  console.debug('Device is closed');
};
