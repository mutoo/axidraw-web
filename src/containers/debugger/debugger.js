import React, { useState } from 'react';
import DeviceConnector from 'components/device-connector/device-connector';
import classnames from 'classnames';
import sheetsStyles from 'components/ui/sheet.css';
import formStyles from 'components/ui/form.css';
import SimpleCommander from './components/simple-commander';
import BatchCommander from './components/batch-commander';

const Debugger = () => {
  const [device, setDevice] = useState(null);
  return (
    <div className={classnames(formStyles.root, sheetsStyles.root)}>
      <DeviceConnector
        onConnected={setDevice}
        onDisconnected={() => setDevice(null)}
      />
      {device?.isConnected && <SimpleCommander device={device} />}
      {device?.isConnected && <BatchCommander device={device} />}
      <div>Build Mode: {process.env.NODE_ENV}</div>
    </div>
  );
};

export default Debugger;
