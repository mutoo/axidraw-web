import createUSBDevice from './usb.js';
import createWSDevice from './websocket.js';
import { DEVICE_TYPE_USB, DEVICE_TYPE_WEBSOCKET } from './consts.js';

export default function createDevice(type) {
  switch (type) {
    default:
    case DEVICE_TYPE_USB:
      return createUSBDevice();
    case DEVICE_TYPE_WEBSOCKET:
      return createWSDevice();
  }
}
