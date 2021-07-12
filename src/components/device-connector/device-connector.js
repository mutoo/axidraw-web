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

const defaultWSAddress = `wss://${window.location.host}/axidraw`;

const DeviceConnector = ({ onConnected, onDisconnected }) => {
  const {
    deviceStatus,
    deviceType,
    setDeviceType,
    deviceVersion,
    device,
    connectError,
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
    <>
      <h3>Device</h3>
      {deviceStatus === DEVICE_STATUS_DISCONNECTED && (
        <>
          <p>Connect to axidraw via USB or WebSocket.</p>
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
          {connectError && <p>{connectError}</p>}
          {deviceType === DEVICE_TYPE_USB && (
            <>
              <button
                type="button"
                onClick={() => {
                  connectDevice(true);
                }}
              >
                Pair
              </button>
              <button
                type="button"
                onClick={() => {
                  connectDevice();
                }}
              >
                Connect
              </button>
            </>
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
              <button
                type="button"
                onClick={() => {
                  connectDevice(wsAddress, wsAuth);
                }}
              >
                Connect
              </button>
            </>
          )}
        </>
      )}
      {deviceStatus === DEVICE_STATUS_CONNECTED && (
        <>
          <p>
            Device Type: {deviceType === DEVICE_TYPE_USB ? 'USB' : 'WebSocket'}
          </p>
          <p>Device Version: {deviceVersion}</p>
          <button type="button" onClick={() => disconnectDevice()}>
            Disconnect
          </button>
        </>
      )}
    </>
  );
};

DeviceConnector.propTypes = {
  onConnected: PropTypes.func,
  onDisconnected: PropTypes.func,
};

export default DeviceConnector;
