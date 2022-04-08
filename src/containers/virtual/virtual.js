import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import sheetsStyles from 'components/ui/sheet.css';
import Footer from 'components/footer/footer';
import {
  VIRTUAL_EVENT_DISCONNECTED,
  VIRTUAL_EVENT_MESSAGE,
  VIRTUAL_EVENT_STARTED,
  VIRTUAL_STATUS_CONNECTED,
  VIRTUAL_STATUS_DISCONNECTED,
} from 'communication/device/consts';
import createVM from './plotter';

const VirtualPlotter = () => {
  const [deviceStatus, setDeviceStatus] = useState(VIRTUAL_STATUS_DISCONNECTED);
  const [plotter, setPlotter] = useState(null);
  useEffect(() => {
    if (!window.opener) {
      // eslint-disable-next-line no-alert
      alert('Please open virtual plotter from axidraw web device connector!');
      window.close();
    }
    const vm = createVM({ version: '2.7.0' });
    const disconnect = () => {
      window.opener.postMessage({
        type: VIRTUAL_EVENT_DISCONNECTED,
      });
    };
    const messageHandle = (event) => {
      switch (event.data.type) {
        case VIRTUAL_EVENT_DISCONNECTED:
          setDeviceStatus(VIRTUAL_STATUS_DISCONNECTED);
          window.removeEventListener('beforeunload', disconnect);
          disconnect();
          break;
        case 'command':
          // eslint-disable-next-line no-console
          console.log('command', event.data.command);
          vm.execute(event.data.command).then((resp) => {
            window.opener.postMessage({
              type: VIRTUAL_EVENT_MESSAGE,
              data: resp,
            });
          });
          break;
        default:
        // ignore
      }
    };
    window.addEventListener('message', messageHandle);
    window.addEventListener('beforeunload', disconnect);
    window.opener.postMessage({
      type: VIRTUAL_EVENT_STARTED,
    });

    setDeviceStatus(VIRTUAL_STATUS_CONNECTED);
    setPlotter(vm);

    return () => {
      window.removeEventListener('message', messageHandle);
      window.removeEventListener('beforeunload', disconnect);
      vm.destroy();
    };
  }, []);

  return (
    <>
      <div className={classnames(sheetsStyles.root)}>
        virtual plotter: {deviceStatus}
      </div>
      <Footer />
    </>
  );
};

export default VirtualPlotter;
