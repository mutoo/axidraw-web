import {
  DEVICE_TYPE_SERIAL,
  DEVICE_TYPE_USB,
  DEVICE_TYPE_VIRTUAL,
  DEVICE_TYPE_WEBSOCKET,
} from './consts';
import type { DevicePicker } from './device';
import createSerialDevice from './serial';
import createUSBDevice from './usb';
import createVirtualDevice from './virtual';
import type { WSDevice } from './webscoket-type';
import createWSDevice from './websocket';

export default function createDevice(
  type: string,
  devicePicker: DevicePicker<USBDevice | SerialPort | WSDevice>,
) {
  switch (type) {
    default:
    case DEVICE_TYPE_USB:
      return createUSBDevice({
        devicePicker: devicePicker as DevicePicker<USBDevice>,
      });
    case DEVICE_TYPE_SERIAL:
      return createSerialDevice({
        devicePicker: devicePicker as DevicePicker<SerialPort>,
      });
    case DEVICE_TYPE_WEBSOCKET:
      return createWSDevice({
        devicePicker: devicePicker as DevicePicker<WSDevice>,
      });
    case DEVICE_TYPE_VIRTUAL:
      return createVirtualDevice();
  }
}
