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
import styles from '../debugger.css';

const defaultWSAddress = `wss://${window.location.host}/axidraw`;

const DeviceConnector = ({ setDevice }) => {
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
    setDevice(device);
  }, [device]);

  return (
    <>
      <h3>Device</h3>
      {deviceStatus === DEVICE_STATUS_DISCONNECTED && (
        <>
          <p>Please select device type:</p>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              value={DEVICE_TYPE_USB}
              checked={deviceType === DEVICE_TYPE_USB}
              onChange={() => setDeviceType(DEVICE_TYPE_USB)}
            />{' '}
            <span>USB</span>
          </label>
          <label className={styles.radioLabel}>
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
              <label className={styles.inputLabel}>
                <span>URL</span>
                <input
                  type="text"
                  value={wsAddress}
                  onChange={(e) => setWSAddress(e.target.value)}
                />
              </label>
              <label className={styles.inputLabel}>
                <span>Password</span>
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
      <div>Build Mode: {process.env.NODE_ENV}</div>
    </>
  );
};

DeviceConnector.propTypes = {
  setDevice: PropTypes.func,
};

export default DeviceConnector;
