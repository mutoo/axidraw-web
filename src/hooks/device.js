import { useCallback, useEffect, useState } from 'react';
import {
  DEVICE_EVENT_CONNECTED,
  DEVICE_EVENT_DISCONNECTED,
  DEVICE_TYPE_USB,
  DEVICE_TYPE_WEBSOCKET,
} from 'communication/device/consts';
import createDevice from 'communication/device';
import { selectFirstDevice } from 'communication/device/utils';
import * as commands from 'communication/ebb';

/* eslint-disable prettier/prettier */
export const DEVICE_STATUS_CONNECTED = 'axidraw_web_device_status_connected';
export const DEVICE_STATUS_DISCONNECTED =
  'axidraw_web_device_status_disconnected';
/* eslint-enable prettier/prettier */

const supportedWebUSB = !!navigator.usb;

export const useDeviceConnector = () => {
  const [deviceStatus, setDeviceStatus] = useState(DEVICE_STATUS_DISCONNECTED);
  const [deviceType, setDeviceType] = useState(
    supportedWebUSB ? DEVICE_TYPE_USB : DEVICE_TYPE_WEBSOCKET,
  );
  const [deviceVersion, setDeviceVersion] = useState(null);
  const [device, setDevice] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // switch device as per device type
  useEffect(() => {
    // TODO: use a modal to select device from list
    if (deviceStatus !== DEVICE_STATUS_CONNECTED) {
      setDevice(createDevice(deviceType, selectFirstDevice));
    }
  }, [deviceType, deviceStatus]);

  // clear connection error
  useEffect(() => {
    setConnectionError(null);
  }, [device, deviceType, setDeviceStatus]);

  // auto disconnect previous device
  useEffect(
    () => () => {
      device?.disconnectDevice();
    },
    [device],
  );

  // listen to connection event
  useEffect(() => {
    const onConnect = () => {
      setDeviceStatus(DEVICE_STATUS_CONNECTED);
      setDeviceVersion(device.version);
    };
    const onDisconnect = (e) => {
      setDeviceStatus(DEVICE_STATUS_DISCONNECTED);
      setDeviceVersion('');
      if (e) {
        setConnectionError(e);
      }
    };
    device?.on(DEVICE_EVENT_CONNECTED, onConnect);
    device?.on(DEVICE_EVENT_DISCONNECTED, onDisconnect);
    return () => {
      device?.off(DEVICE_EVENT_CONNECTED, onConnect);
      device?.off(DEVICE_EVENT_DISCONNECTED, onDisconnect);
    };
  }, [device]);

  // connect device handle
  const connectDevice = useCallback(
    async (...args) => {
      if (device && deviceStatus === DEVICE_STATUS_DISCONNECTED) {
        try {
          await device.connectDevice(...args);
        } catch (e) {
          setConnectionError(e.toString());
          await device.disconnectDevice();
        }
      } else if (!device) {
        setConnectionError('Device is not created yet.');
      } else {
        setConnectionError('Device is already connected yet.');
      }
    },
    [device],
  );

  // disconnect device handle
  const disconnectDevice = useCallback(async () => {
    if (device && deviceStatus === DEVICE_STATUS_CONNECTED) {
      try {
        await device.executeCommand(commands.r);
        await device.disconnectDevice();
      } catch (e) {
        setConnectionError(e.toString());
      }
    } else {
      setConnectionError('Device is not connected yet.');
    }
  }, [device, deviceStatus]);

  return {
    device,
    deviceType,
    setDeviceType,
    deviceStatus,
    deviceVersion,
    connectionError,
    connectDevice,
    disconnectDevice,
  };
};
