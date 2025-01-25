import classnames from 'clsx';
import { useState } from 'react';
import { IDeviceConnector } from '@/communication/device/device';
import DeviceConnector from '@/components/device-connector/device-connector';
import formStyles from '@/components/ui/form.module.css';
import sheetsStyles from '@/components/ui/sheet.module.css';
import Footer from '../../components/footer/footer';
import BatchCommander from './components/batch-commander';
import FavCommander from './components/fav-commander';
import SimpleCommander from './components/simple-commander';

const Debugger = () => {
  const [device, setDevice] = useState<IDeviceConnector<unknown> | null>(null);
  return (
    <>
      <div className={classnames(formStyles.root, sheetsStyles.root)}>
        <DeviceConnector
          onConnected={setDevice}
          onDisconnected={() => {
            setDevice(null);
          }}
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
