import EventEmitter from 'events';
import handleEBBMessages from '../ebb/messages/ebb';
import { encode } from '../ebb/utils';
import { DEVICE_EVENT_DISCONNECTED, DEVICE_TYPE_SERIAL } from './consts';
import type { DevicePicker, IDevice } from './device';
import type { PendingCommand } from './utils';
import { createDeviceBind, logger } from './utils';

export const EBB_VENDOR_ID = 0x04d8;
export const EBB_PRODUCT_ID = 0xfd92;
// the EBB is a USB serial device, so it ignores the baud rate, but it's asked for
export const BAUD_RATE = 9600;

const isEBB = (port: SerialPort) => {
  const { usbVendorId, usbProductId } = port.getInfo();
  return usbVendorId === EBB_VENDOR_ID && usbProductId === EBB_PRODUCT_ID;
};

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

export const connectDevice =
  ({ devicePicker }: { devicePicker: DevicePicker<SerialPort> }) =>
  async (
    commandQueue: PendingCommand<unknown>[],
    config: { pair: boolean },
  ): Promise<IDevice> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!navigator.serial) {
      throw new Error('Web Serial feature is not supported in this browser!');
    }
    let port: SerialPort;
    const emitter = new EventEmitter();
    // the ports this site may use, of which only AxiDraws are wanted
    const ports = (await navigator.serial.getPorts()).filter(isEBB);
    logger.debug(`Found ${ports.length} serial port(s).`);
    const { pair } = config;
    if (pair || !ports.length) {
      // select or pair a port from the native port picker
      port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: EBB_VENDOR_ID, usbProductId: EBB_PRODUCT_ID }],
      });
    } else {
      // select from paired ports
      port = await devicePicker(ports);
    }
    logger.debug('Opening serial port...');
    await port.open({ baudRate: BAUD_RATE });
    const writer = port.writable!.getWriter();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let isOpen = true;
    let closing = false;

    const listen = async () => {
      logger.debug('Start listening data.');
      const messageHandler = handleEBBMessages(commandQueue);
      messageHandler.next(); // kick off the generator
      let reason = 'Device is disconnected.';
      // a framing or overrun error leaves the port readable, losing the device doesn't
      while (!closing && port.readable) {
        reader = port.readable.getReader();
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            // the view may cover only part of its buffer
            messageHandler.next(
              value.buffer.slice(
                value.byteOffset,
                value.byteOffset + value.byteLength,
              ),
            );
          }
        } catch (e) {
          reason = errorMessage(e);
          logger.debug(reason);
        } finally {
          reader.releaseLock();
          reader = null;
        }
      }
      logger.debug('Stop listening data.');
      messageHandler.return();
      isOpen = false;
      writer.releaseLock();
      try {
        await port.close();
        logger.debug('Serial port is closed');
      } catch (e) {
        // a port that's gone can't be closed
        logger.debug(errorMessage(e));
      }
      emitter.emit(DEVICE_EVENT_DISCONNECTED, closing ? '' : reason);
    };
    // start listening the data coming in
    const listening = listen();

    return {
      get isReady() {
        return isOpen && !closing;
      },
      checkStatus() {
        if (!isOpen || closing) {
          throw new Error('Serial port is not opened');
        }
      },
      async send(message) {
        logger.debug('Send to communication.device: ', message);
        await writer.write(encode(message));
      },
      async disconnect() {
        logger.debug('Closing serial port...');
        closing = true;
        // ends the read, and the listener closes the port and says it's closed
        await reader?.cancel();
        await listening;
      },
      onDisconnected(listener) {
        emitter.on(DEVICE_EVENT_DISCONNECTED, listener);
      },
    };
  };

export default function createSerialDevice({
  devicePicker,
}: {
  devicePicker: DevicePicker<SerialPort>;
}) {
  return createDeviceBind({
    type: DEVICE_TYPE_SERIAL,
    connectDevice: connectDevice({ devicePicker }),
  });
}
