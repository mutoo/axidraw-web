import { useCallback, useEffect, useState } from 'react';
import createDevice from '@/communication/device';
import {
  DEVICE_EVENT_CONNECTED,
  DEVICE_EVENT_DISCONNECTED,
  DEVICE_TYPE_USB,
  DEVICE_TYPE_WEBSOCKET,
} from '@/communication/device/consts';
import { IDeviceConnector } from '@/communication/device/device';
import { selectFirstDevice } from '@/communication/device/utils';
import * as commands from '@/communication/ebb';

export const DEVICE_STATUS_CONNECTED = 'axidraw_web_device_status_connected';
export const DEVICE_STATUS_DISCONNECTED =
  'axidraw_web_device_status_disconnected';

const supportedWebUSB = !!navigator.usb;

export const useDeviceConnector = () => {
  const [deviceStatus, setDeviceStatus] = useState(DEVICE_STATUS_DISCONNECTED);
  const [deviceType, setDeviceType] = useState(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    supportedWebUSB ? DEVICE_TYPE_USB : DEVICE_TYPE_WEBSOCKET,
  );
  const [deviceVersion, setDeviceVersion] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [device, setDevice] = useState<IDeviceConnector<any> | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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
      void device?.disconnectDevice();
    },
    [device],
  );

  // listen to connection event
  useEffect(() => {
    const onConnect = () => {
      setDeviceStatus(DEVICE_STATUS_CONNECTED);
      setDeviceVersion(device!.version);
    };
    const onDisconnect = (e: string) => {
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
    async (config: unknown) => {
      if (device && deviceStatus === DEVICE_STATUS_DISCONNECTED) {
        try {
          await device.connectDevice(config);
        } catch (e) {
          if (e instanceof Error) {
            setConnectionError(e.message);
          } else {
            setConnectionError(String(e));
          }
          await device.disconnectDevice();
        }
      } else if (!device) {
        setConnectionError('Device is not created yet.');
      } else {
        setConnectionError('Device is already connected yet.');
      }
    },
    [device, deviceStatus],
  );

  // disconnect device handle
  const disconnectDevice = useCallback(async () => {
    if (device && deviceStatus === DEVICE_STATUS_CONNECTED) {
      try {
        await device.executeCommand(commands.r);
        await device.disconnectDevice();
      } catch (e) {
        setConnectionError(String(e));
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
