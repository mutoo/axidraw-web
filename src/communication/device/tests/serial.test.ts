import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import qb from '../../ebb/commands/qb';
import v from '../../ebb/commands/v';
import { DEVICE_EVENT_DISCONNECTED } from '../consts';
import createSerialDevice, {
  BAUD_RATE,
  EBB_PRODUCT_ID,
  EBB_VENDOR_ID,
} from '../serial';

const EBB_INFO = { usbVendorId: EBB_VENDOR_ID, usbProductId: EBB_PRODUCT_ID };

// a serial port that answers like an EBB, with the replies given for each command
const createPort = (
  info: SerialPortInfo = EBB_INFO,
  replies: Record<string, string> = {
    'R\r': 'OK\r\nOK\r\n',
    'V\r': 'EBBv13_and_above EB Firmware Version 2.7.0\r\n',
  },
) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let source: ReadableStreamDefaultController<Uint8Array>;
  const sent: string[] = [];
  const port = {
    readable: null as ReadableStream<Uint8Array> | null,
    writable: null as WritableStream<Uint8Array> | null,
    getInfo: () => info,
    open: vi.fn((options: SerialOptions) => {
      if (port.readable) throw new Error('The port is already open.');
      expect(options.baudRate).toBe(BAUD_RATE);
      port.readable = new ReadableStream({
        start(controller) {
          source = controller;
        },
      });
      port.writable = new WritableStream({
        write(chunk) {
          const command = decoder.decode(chunk);
          sent.push(command);
          const reply = replies[command] ?? '';
          // later, as a real EBB does, one byte at a time, each from the middle
          // of a bigger buffer
          setTimeout(() => {
            for (const byte of encoder.encode(reply)) {
              const buffer = new Uint8Array([0, byte, 0]);
              source.enqueue(buffer.subarray(1, 2));
            }
          }, 0);
        },
      });
      return Promise.resolve();
    }),
    close: vi.fn(() => {
      port.readable = null;
      port.writable = null;
      return Promise.resolve();
    }),
    // the device is unplugged
    lose() {
      source.error(new Error('The device has been lost.'));
      port.readable = null;
    },
    sent,
  };
  return port;
};

type Port = ReturnType<typeof createPort>;

const selectFirstPort = (ports: SerialPort[]) => Promise.resolve(ports[0]);

describe('serial device', () => {
  let granted: Port[];
  let requested: Port;
  let requestPort: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    granted = [];
    requested = createPort();
    requestPort = vi.fn(() => Promise.resolve(requested));
    vi.stubGlobal('navigator', {
      serial: {
        getPorts: () => Promise.resolve(granted),
        requestPort,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for an AxiDraw when none is paired', async () => {
    const device = createSerialDevice({ devicePicker: selectFirstPort });
    await device.connectDevice({ pair: false });
    expect(requestPort).toHaveBeenCalledWith({
      filters: [EBB_INFO],
    });
    expect(requested.sent).toEqual(['R\r', 'V\r']);
    expect(device.version).toBe('2.7.0');
    expect(device.isConnected).toBe(true);
    await device.disconnectDevice();
  });

  it('connects to a paired AxiDraw, leaving other ports alone', async () => {
    const other = createPort({ usbVendorId: 0x2341, usbProductId: 0x0043 });
    const paired = createPort();
    granted = [other, paired];
    const devicePicker = vi.fn(selectFirstPort);
    const device = createSerialDevice({ devicePicker });
    await device.connectDevice({ pair: false });
    expect(requestPort).not.toHaveBeenCalled();
    expect(devicePicker).toHaveBeenCalledWith([paired]);
    expect(other.open).not.toHaveBeenCalled();
    expect(paired.sent).toEqual(['R\r', 'V\r']);
    await device.disconnectDevice();
  });

  it('pairs a new AxiDraw when asked to', async () => {
    granted = [createPort()];
    const device = createSerialDevice({ devicePicker: selectFirstPort });
    await device.connectDevice({ pair: true });
    expect(requestPort).toHaveBeenCalled();
    expect(requested.sent).toEqual(['R\r', 'V\r']);
    await device.disconnectDevice();
  });

  it('sends commands and reads what the EBB responds', async () => {
    const device = createSerialDevice({ devicePicker: selectFirstPort });
    await device.connectDevice({ pair: false });
    await expect(device.executeCommand(v)).resolves.toBe(
      'EBBv13_and_above EB Firmware Version 2.7.0',
    );
    await device.disconnectDevice();
  });

  it('closes the port on disconnect, without an error', async () => {
    const device = createSerialDevice({ devicePicker: selectFirstPort });
    const disconnected = vi.fn();
    device.on(DEVICE_EVENT_DISCONNECTED, disconnected);
    await device.connectDevice({ pair: false });
    await device.disconnectDevice();
    expect(requested.close).toHaveBeenCalled();
    expect(device.isConnected).toBe(false);
    expect(disconnected).toHaveBeenCalledWith('');
    await expect(device.executeCommand(v)).rejects.toThrow(/not connected/);
  });

  it('says why when the AxiDraw is unplugged, and fails its waiting commands', async () => {
    const device = createSerialDevice({ devicePicker: selectFirstPort });
    const disconnected = vi.fn();
    device.on(DEVICE_EVENT_DISCONNECTED, disconnected);
    await device.connectDevice({ pair: false });
    // the port has no reply to QB, so it waits
    const waiting = device.executeCommand(qb);
    await vi.waitFor(() => {
      expect(requested.sent).toContain('QB\r');
    });
    requested.lose();
    await expect(waiting).rejects.toBe('The device has been lost.');
    expect(disconnected).toHaveBeenCalledWith('The device has been lost.');
    expect(device.isConnected).toBe(false);
  });

  it('says so when the browser has no Web Serial', async () => {
    vi.stubGlobal('navigator', {});
    const device = createSerialDevice({ devicePicker: selectFirstPort });
    await expect(device.connectDevice({ pair: false })).rejects.toThrow(
      /not supported/,
    );
  });
});
