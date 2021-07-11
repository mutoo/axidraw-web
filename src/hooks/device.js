import { useCallback, useEffect, useState } from 'react';
import { DEVICE_TYPE_USB } from 'communication/device/consts';
import createDevice from 'communication/device';
import { selectFirstDevice } from 'communication/device/utils';
import * as commands from 'communication/ebb';

/* eslint-disable prettier/prettier */
export const DEVICE_STATUS_CONNECTED = 'axidraw_web_device_status_connected';
export const DEVICE_STATUS_DISCONNECTED = 'axidraw_web_device_status_disconnected';
/* eslint-enable prettier/prettier */

export const useDeviceConnector = () => {
  const [deviceStatus, setDeviceStatus] = useState(DEVICE_STATUS_DISCONNECTED);
  const [deviceType, setDeviceType] = useState(DEVICE_TYPE_USB);
  const [deviceVersion, setDeviceVersion] = useState(null);
  const [device, setDevice] = useState(null);
  const [connectError, setConnectError] = useState(null);

  useEffect(
    () =>
      async function autoDisconnect() {
        if (device) {
          await device.disconnectDevice();
        }
        setDeviceStatus(DEVICE_STATUS_DISCONNECTED);
        setDeviceVersion('');
      },
    [device],
  );

  useEffect(() => {
    setConnectError(null);
  }, [device, deviceType, setDeviceStatus]);

  useEffect(() => {
    // TODO: use a modal to select device from list
    setDevice(createDevice(deviceType, selectFirstDevice));
  }, [deviceType]);

  const connectDevice = useCallback(
    async (...args) => {
      if (device) {
        try {
          await device.connectDevice(...args);
          await device.checkDevice();
          await device.executeCommand(commands.r);
          setDeviceVersion(device.version);
          setDeviceStatus(DEVICE_STATUS_CONNECTED);
        } catch (e) {
          setConnectError(e.toString());
        }
      }
    },
    [device],
  );

  const disconnectDevice = useCallback(async () => {
    if (device && deviceStatus === DEVICE_STATUS_CONNECTED) {
      await device.executeCommand(commands.r);
      await device.disconnectDevice();
      setDeviceStatus(DEVICE_STATUS_DISCONNECTED);
      setDeviceVersion('');
    }
  }, [device, deviceStatus]);

  return {
    device,
    deviceType,
    setDeviceType,
    deviceStatus,
    deviceVersion,
    connectError,
    connectDevice,
    disconnectDevice,
  };
};
