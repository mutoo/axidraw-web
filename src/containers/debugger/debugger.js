import React, { useState } from 'react';
import DeviceConnector from 'containers/debugger/components/device-connector';
import styles from './debugger.css';

const Debugger = () => {
  // eslint-disable-next-line no-unused-vars
  const [device, setDevice] = useState(null);
  return (
    <div className={styles.debugger}>
      <DeviceConnector setDevice={setDevice} />
    </div>
  );
};

export default Debugger;
