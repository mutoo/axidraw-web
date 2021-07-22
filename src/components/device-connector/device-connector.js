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
} from 'communication/device/consts';
import formStyles from 'components/ui/form.css';
import Button from '../ui/button/button';
import Alert from '../ui/alert/alert';

const defaultWSAddress = `wss://${window.location.host}/axidraw`;

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

  useEffect(() => {
    if (deviceStatus === DEVICE_STATUS_CONNECTED) {
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
          <p>Connect to AxiDraw via USB or WebSocket.</p>
          <label className={formStyles.radioLabel}>
            <input
              type="radio"
              value={DEVICE_TYPE_USB}
              checked={deviceType === DEVICE_TYPE_USB}
              onChange={() => setDeviceType(DEVICE_TYPE_USB)}
            />{' '}
            <span>USB</span>
          </label>
          <label className={formStyles.radioLabel}>
            <input
              type="radio"
              value={DEVICE_TYPE_WEBSOCKET}
              checked={deviceType === DEVICE_TYPE_WEBSOCKET}
              onChange={() => setDeviceType(DEVICE_TYPE_WEBSOCKET)}
            />{' '}
            <span>WebSocket</span>
          </label>
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
        </>
      )}
      {deviceStatus === DEVICE_STATUS_CONNECTED && (
        <>
          <div className="grid grid-flow-col items-center gap-4">
            <p>{deviceType === DEVICE_TYPE_USB ? 'USB' : 'WebSocket'}</p>
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
