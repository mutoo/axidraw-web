import {
  DEVICE_TYPE_USB,
  DEVICE_TYPE_VIRTUAL,
  DEVICE_TYPE_WEBSOCKET,
} from './consts';
import { DevicePicker } from './device';
import createUSBDevice from './usb';
import createVirtualDevice from './virtual';
import createWSDevice, { WSDevice } from './websocket';

export default function createDevice(
  type: string,
  devicePicker: DevicePicker<USBDevice | WSDevice>,
) {
  switch (type) {
    default:
    case DEVICE_TYPE_USB:
      return createUSBDevice({
        devicePicker: devicePicker as DevicePicker<USBDevice>,
      });
    case DEVICE_TYPE_WEBSOCKET:
      return createWSDevice({
        devicePicker: devicePicker as DevicePicker<WSDevice>,
      });
    case DEVICE_TYPE_VIRTUAL:
      return createVirtualDevice();
  }
}
