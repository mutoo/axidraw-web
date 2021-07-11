import React, { useState } from 'react';
import DeviceConnector from './components/device-connector';
import SimpleCommander from './components/simple-commander';
import styles from './debugger.css';

const Debugger = () => {
  const [device, setDevice] = useState(null);
  return (
    <div className={styles.debugger}>
      <DeviceConnector
        onConnected={setDevice}
        onDisconnected={() => setDevice(null)}
      />
      {device?.version && <SimpleCommander device={device} />}
      <div>Build Mode: {process.env.NODE_ENV}</div>
    </div>
  );
};

export default Debugger;
