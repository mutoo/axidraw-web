import classnames from 'clsx';
import { useState } from 'react';
import { IDeviceConnector } from '@/communication/device/device';
import DeviceConnector from '@/components/device-connector/device-connector';
import Footer from '@/components/footer/footer';
import formStyles from '@/components/ui/form.module.css';
import sheetsStyles from '@/components/ui/sheet.module.css';
import MidiCommander from './components/midi-commander';

const Composer = () => {
  const [device, setDevice] = useState<IDeviceConnector<unknown> | null>(null);

  return (
    <>
      <div className={classnames(formStyles.root, sheetsStyles.root)}>
        <DeviceConnector
          onConnected={setDevice}
          onDisconnected={() => { setDevice(null); }}
        />
        {device && <MidiCommander device={device} />}
      </div>
      <Footer />
    </>
  );
};

export default Composer;
