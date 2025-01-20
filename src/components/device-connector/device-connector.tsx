import { ChevronsLeftRightEllipsis } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackCategoryEvent } from '@/analystic';
import {
  DEVICE_TYPE_USB,
  DEVICE_TYPE_WEBSOCKET,
  DEVICE_TYPE_VIRTUAL,
} from '@/communication/device/consts';
import { IDeviceConnector } from '@/communication/device/device';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import formStyles from '@/components/ui/form.module.css';
import {
  DEVICE_STATUS_CONNECTED,
  DEVICE_STATUS_DISCONNECTED,
  useDeviceConnector,
} from '@/hooks/device';
import { Button } from '../ui/button';

const defaultWSAddress = `wss://${window.location.host}/axidraw`;

const trackEvent = trackCategoryEvent('connector');

const DeviceOption = ({
  label,
  type,
  deviceType,
  setDeviceType,
}: {
  label: string;
  type: string;
  deviceType: string;
  setDeviceType: (type: string) => void;
}) => {
  return (
    <label className={formStyles.radioLabel}>
      <input
        type="radio"
        value={type}
        checked={deviceType === type}
        onChange={() => {
          setDeviceType(type);
        }}
      />{' '}
      <span>{label}</span>
    </label>
  );
};

const DeviceConnector = ({
  onConnected,
  onDisconnected,
}: {
  onConnected: (device: IDeviceConnector<unknown>) => void;
  onDisconnected: (device: IDeviceConnector<unknown>) => void;
}) => {
  const {
    deviceStatus,
    deviceType,
    setDeviceType,
    deviceVersion,
    device,
    connectionError,
    connectDevice,
    disconnectDevice,
  } = useDeviceConnector();
  const [wsAddress, setWSAddress] = useState(defaultWSAddress);
  const [wsAuth, setWSAuth] = useState('axidraw-web');
  const [virtualVersion, setVirtualVersion] = useState('2.7.0');

  useEffect(() => {
    if (!device) return;
    if (deviceStatus === DEVICE_STATUS_CONNECTED) {
      trackEvent('type', device.type);
      onConnected(device);
    } else {
      onDisconnected(device);
    }
  }, [device, deviceStatus, onConnected, onDisconnected]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <h3>Device</h3>
      {deviceStatus === DEVICE_STATUS_DISCONNECTED && (
        <>
          <p>Connect to AxiDraw via USB, WebSocket or Virtual Plotter.</p>
          <DeviceOption
            type={DEVICE_TYPE_USB}
            label={'USB'}
            deviceType={deviceType}
            setDeviceType={setDeviceType}
          />
          <DeviceOption
            type={DEVICE_TYPE_WEBSOCKET}
            label={'WebSocket'}
            deviceType={deviceType}
            setDeviceType={setDeviceType}
          />
          <DeviceOption
            type={DEVICE_TYPE_VIRTUAL}
            label={'Virtual Plotter'}
            deviceType={deviceType}
            setDeviceType={setDeviceType}
          />
          {connectionError && (
            <Alert variant="destructive">
              <ChevronsLeftRightEllipsis className="h-4 w-4" />
              <AlertTitle>Connection Issue</AlertTitle>
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}
          {deviceType === DEVICE_TYPE_USB && (
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <Button
                variant="secondary"
                onClick={() => {
                  void connectDevice({ pair: true });
                }}
              >
                Pair new device
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  void connectDevice({ pair: false });
                }}
              >
                Connect
              </Button>
            </div>
          )}
          {deviceType === DEVICE_TYPE_WEBSOCKET && (
            <>
              <label className={formStyles.inputLabel}>
                <span>URL:</span>
                <input
                  type="text"
                  value={wsAddress}
                  onChange={(e) => {
                    setWSAddress(e.target.value);
                  }}
                />
              </label>
              <label className={formStyles.inputLabel}>
                <span>Password:</span>
                <input
                  type="password"
                  value={wsAuth}
                  onChange={(e) => {
                    setWSAuth(e.target.value);
                  }}
                />
              </label>
              <Button
                variant="default"
                onClick={() => {
                  void connectDevice({ address: wsAddress, auth: wsAuth });
                }}
              >
                Connect
              </Button>
            </>
          )}
          {deviceType === DEVICE_TYPE_VIRTUAL && (
            <>
              <label className={formStyles.inputLabel}>
                <span>Version:</span>
                <select
                  value={virtualVersion}
                  onChange={(e) => {
                    setVirtualVersion(e.target.value);
                  }}
                >
                  <option>2.7.0</option>
                </select>
              </label>
              <Button
                variant="default"
                onClick={() => {
                  void connectDevice({ version: virtualVersion });
                }}
              >
                Create
              </Button>
            </>
          )}
        </>
      )}
      {deviceStatus === DEVICE_STATUS_CONNECTED && (
        <>
          <div className="grid grid-flow-col items-center gap-4">
            {deviceType === DEVICE_TYPE_USB && <p>USB</p>}
            {deviceType === DEVICE_TYPE_WEBSOCKET && <p>WebSocket</p>}
            {deviceType === DEVICE_TYPE_VIRTUAL && <p>Virtual Plotter</p>}
            <p>EBB v{deviceVersion}</p>
            <Button
              variant={'secondary'}
              onClick={() => void disconnectDevice()}
            >
              Disconnect
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceConnector;
