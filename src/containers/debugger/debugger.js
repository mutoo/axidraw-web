import React, { useState } from 'react';
import DeviceConnector from 'components/device-connector/device-connector';
import classnames from 'classnames';
import sheetsStyles from 'components/ui/sheet.css';
import formStyles from 'components/ui/form.css';
import SimpleCommander from './components/simple-commander';
import BatchCommander from './components/batch-commander';
import FavCommander from './components/fav-commander';
import Footer from '../../components/footer/footer';

const Debugger = () => {
  const [device, setDevice] = useState(null);
  return (
    <>
      <div className={classnames(formStyles.root, sheetsStyles.root)}>
        <DeviceConnector
          onConnected={setDevice}
          onDisconnected={() => setDevice(null)}
        />
        {device && <FavCommander device={device} />}
        {device && <SimpleCommander device={device} />}
        {device && <BatchCommander device={device} />}
      </div>
      <Footer />
    </>
  );
};

export default Debugger;
