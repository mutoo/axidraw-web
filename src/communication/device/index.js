import { DEVICE_TYPE_USB, DEVICE_TYPE_WEBSOCKET } from './consts';
import createUSBDevice from './usb';
import createWSDevice from './websocket';

export default function createDevice(type, devicePicker) {
  switch (type) {
    default:
    case DEVICE_TYPE_USB:
      return createUSBDevice({ devicePicker });
    case DEVICE_TYPE_WEBSOCKET:
      return createWSDevice({ devicePicker });
  }
}
