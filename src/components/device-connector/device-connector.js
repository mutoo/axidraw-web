import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  DEVICE_STATUS_CONNECTED,
  DEVICE_STATUS_DISCONNECTED,
  useDeviceConnector,
} from 'hooks/device';
import {
  DEVICE_TYPE_USB,
  DEVICE_TYPE_WEBSOCKET,
  DEVICE_TYPE_VIRTUAL,
} from 'communication/device/consts';
import formStyles from 'components/ui/form.css';
import { trackCategoryEvent } from 'configureGA';
import Button from '../ui/button/button';
import Alert from '../ui/alert/alert';

const defaultWSAddress = `wss://${window.location.host}/axidraw`;

const trackEvent = trackCategoryEvent('connector');

const DeviceOption = ({ label, type, deviceType, setDeviceType }) => {
  return (
    <label className={formStyles.radioLabel}>
      <input
        type="radio"
        value={type}
        checked={deviceType === type}
        onChange={() => setDeviceType(type)}
      />{' '}
      <span>{label}</span>
    </label>
  );
};

DeviceOption.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  deviceType: PropTypes.string.isRequired,
  setDeviceType: PropTypes.func.isRequired,
};

const DeviceConnector = ({ onConnected, onDisconnected }) => {
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
    if (deviceStatus === DEVICE_STATUS_CONNECTED) {
      trackEvent('type', device.type);
      onConnected(device);
    } else {
      onDisconnected(device);
    }
  }, [device, deviceStatus]);

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
          {connectionError && <Alert type={'alert'}>{connectionError}</Alert>}
          {deviceType === DEVICE_TYPE_USB && (
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <Button
                onClick={() => {
                  connectDevice(true);
                }}
              >
                Pair
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  connectDevice();
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
                  onChange={(e) => setWSAddress(e.target.value)}
                />
              </label>
              <label className={formStyles.inputLabel}>
                <span>Password:</span>
                <input
                  type="password"
                  value={wsAuth}
                  onChange={(e) => setWSAuth(e.target.value)}
                />
              </label>
              <Button
                variant="primary"
                onClick={() => {
                  connectDevice(wsAddress, wsAuth);
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
                  onChange={(e) => setVirtualVersion(e.target.value)}
                >
                  <option>2.7.0</option>
                </select>
              </label>
              <Button
                variant="primary"
                onClick={() => {
                  connectDevice(virtualVersion);
                }}
              >
                Connect
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
            <Button onClick={() => disconnectDevice()}>Disconnect</Button>
          </div>
        </>
      )}
    </div>
  );
};

DeviceConnector.propTypes = {
  onConnected: PropTypes.func,
  onDisconnected: PropTypes.func,
};

export default DeviceConnector;
