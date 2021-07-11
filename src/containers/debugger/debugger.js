import React, { useCallback, useEffect, useState } from 'react';
import createDevice from 'communication/device';
import {
  DEVICE_TYPE_USB,
  DEVICE_TYPE_WEBSOCKET,
} from 'communication/device/consts';
import { selectFirstDevice } from 'communication/device/utils';
import * as commands from 'communication/ebb';
import styles from './debugger.css';

const defaultWSAddress = `wss://${window.location.host}/axidraw`;

const Debugger = () => {
  const [deviceStatus, setDeviceStatus] = useState('disconnected');
  const [deviceType, setDeviceType] = useState(DEVICE_TYPE_USB);
  const [deviceVersion, setDeviceVersion] = useState(null);
  const [device, setDevice] = useState(null);
  const [connectError, setConnectError] = useState(null);
  const [wsAddress, setWSAddress] = useState(defaultWSAddress);
  const [wsAuth, setWSAuth] = useState('axidraw-web');

  useEffect(
    () =>
      async function autoDisconnect() {
        if (device) {
          await device.disconnectDevice();
        }
        setDeviceStatus('disconnected');
        setDeviceVersion('');
      },
    [device],
  );

  useEffect(() => {
    setConnectError(null);
  }, [device, deviceType, setDeviceStatus]);

  useEffect(async () => {
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
          setDeviceStatus('connected');
        } catch (e) {
          setConnectError(e.toString());
        }
      }
    },
    [device],
  );

  const disconnectDevice = useCallback(async () => {
    if (device) {
      await device.executeCommand(commands.r);
      await device.disconnectDevice();
      setDeviceStatus('disconnected');
      setDeviceVersion('');
    }
  }, [device]);

  return (
    <div className={styles.debugger}>
      <h3>Device</h3>
      {deviceStatus === 'disconnected' && (
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
      {deviceStatus === 'connected' && (
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
    </div>
  );
};

export default Debugger;
