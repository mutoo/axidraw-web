import { Command } from '../ebb/command';

export interface IDevice {
  /**
   * Check if the device is ready to send messages.
   */
  isReady: boolean;
  /**
   * Check the status of the device. Throw an error if the device is not ready.
   */
  checkStatus(): void;
  /**
   * Send a message to the device.
   */
  send(message: string): Promise<void>;
  /**
   * Disconnect the device.
   */
  disconnect(): Promise<void>;
  /**
   * Listen for the device disconnected event.
   */
  onDisconnected(listener: (reason: string) => void): void;
}

export type DevicePicker<T> = (devices: T[]) => Promise<T>;

export interface IDeviceConnector<C> {
  connectDevice: (config: C) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeCommand: <T extends any[], R>(
    cmd: Command<T, R>,
    ...params: T
  ) => Promise<R>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, listener: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, listener: (...args: any[]) => void): void;
  type: string;
  version: string;
  isConnected: boolean;
}
