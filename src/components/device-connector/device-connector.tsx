import { ChevronsLeftRightEllipsis } from 'lucide-react';
import { useState, useEffect, useId } from 'react';
import { trackCategoryEvent } from '@/analystic';
import {
  DEVICE_TYPE_SERIAL,
  DEVICE_TYPE_USB,
  DEVICE_TYPE_WEBSOCKET,
  DEVICE_TYPE_VIRTUAL,
} from '@/communication/device/consts';
import type { IDeviceConnector } from '@/communication/device/device';
import PageSizeSelect from '@/components/page-size-select/page-size-select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import formStyles from '@/components/ui/form.module.css';

import {
  DEVICE_STATUS_CONNECTED,
  DEVICE_STATUS_DISCONNECTED,
  useDeviceConnector,
} from '@/hooks/device';
import { defaultPageSize } from '@/plotter/page-sizes';
import { Button } from '../ui/button';

const defaultWSAddress = `wss://${window.location.host}/axidraw`;

// the README's notes on the EBB firmware versions the apps work with
export const FIRMWARE_URL = 'https://github.com/mutoo/axidraw-web#ebb-firmware';
// the docs on how the ways to connect differ
export const CONNECTING_URL =
  'https://github.com/mutoo/axidraw-web/blob/main/docs/connecting.md';

const trackEvent = trackCategoryEvent('connector');

const FirmwareNote = () => (
  <p className="text-sm text-muted-foreground">
    Works best with EBB firmware 2.7.0 to 2.8.1. Older versions can do less, and
    3.x can't connect yet.{' '}
    <a
      className="underline"
      href={FIRMWARE_URL}
      target="_blank"
      rel="noreferrer"
    >
      More on firmware
    </a>
  </p>
);

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
  const [virtualPaper, setVirtualPaper] = useState(defaultPageSize.id);
  const virtualVersionHintId = useId();

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
          <p>
            Connect to AxiDraw via Web USB, Web Serial, Web Socket or Virtual
            Plotter.{' '}
            <a
              className="underline"
              href={CONNECTING_URL}
              target="_blank"
              rel="noreferrer"
            >
              Which one?
            </a>
          </p>
          <DeviceOption
            type={DEVICE_TYPE_USB}
            label={'Web USB'}
            deviceType={deviceType}
            setDeviceType={setDeviceType}
          />
          <DeviceOption
            type={DEVICE_TYPE_SERIAL}
            label={'Web Serial'}
            deviceType={deviceType}
            setDeviceType={setDeviceType}
          />
          <DeviceOption
            type={DEVICE_TYPE_WEBSOCKET}
            label={'Web Socket'}
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
          {(deviceType === DEVICE_TYPE_USB ||
            deviceType === DEVICE_TYPE_SERIAL) && (
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
              <div className="grid grid-cols-1 gap-2">
                <label className={formStyles.inputLabel}>
                  <span>Version:</span>
                  <select
                    value={virtualVersion}
                    aria-describedby={virtualVersionHintId}
                    onChange={(e) => {
                      setVirtualVersion(e.target.value);
                    }}
                  >
                    <option>2.7.0</option>
                  </select>
                </label>
                <p
                  id={virtualVersionHintId}
                  className="text-sm text-muted-foreground"
                >
                  The EBB firmware version the virtual plotter reports. The apps
                  check it before they send a command, as with a real AxiDraw.
                </p>
              </div>
              <label className={formStyles.inputLabel}>
                <span>Paper:</span>
                <PageSizeSelect
                  value={virtualPaper}
                  onChange={(size) => {
                    setVirtualPaper(size.id);
                  }}
                />
              </label>
              <Button
                variant="default"
                onClick={() => {
                  void connectDevice({
                    version: virtualVersion,
                    paper: virtualPaper,
                  });
                }}
              >
                Create
              </Button>
            </>
          )}
          {deviceType !== DEVICE_TYPE_VIRTUAL && <FirmwareNote />}
        </>
      )}
      {deviceStatus === DEVICE_STATUS_CONNECTED && (
        <>
          <div className="grid grid-flow-col items-center gap-4">
            {deviceType === DEVICE_TYPE_USB && <p>Web USB</p>}
            {deviceType === DEVICE_TYPE_SERIAL && <p>Web Serial</p>}
            {deviceType === DEVICE_TYPE_WEBSOCKET && <p>Web Socket</p>}
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
