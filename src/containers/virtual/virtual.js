import React, { useEffect } from 'react';
import classnames from 'classnames';
import sheetsStyles from 'components/ui/sheet.css';
import Footer from '../../components/footer/footer';
import {
  VIRTUAL_EVENT_CONNECTED,
  VIRTUAL_EVENT_DISCONNECTED,
  VIRTUAL_EVENT_MESSAGE,
} from '../../communication/device/consts';
import { ENDING_OK_CR_NL } from '../../communication/ebb/constants';

const VirtualPlotter = () => {
  useEffect(() => {
    if (!window.opener) {
      // eslint-disable-next-line no-alert
      alert('please open virual plotter from axidraw web device connector!');
      window.close();
    }
    const disconnect = () => {
      window.opener.postMessage({
        type: VIRTUAL_EVENT_DISCONNECTED,
      });
    };
    const send = (msg) => {
      window.opener.postMessage({
        type: VIRTUAL_EVENT_MESSAGE,
        data: msg,
      });
    };
    const executeCommand = (command) => {
      switch (command[0]) {
        case 'R':
          send(ENDING_OK_CR_NL + ENDING_OK_CR_NL);
          break;
        case 'V':
          send('EBBv13_and_above EB Firmware Version 2.7.0\r\n');
          break;
        case 'Q':
          if (command[1] === 'B') {
            send('0');
          }
        // eslint-disable-next-line no-fallthrough
        default:
          send(ENDING_OK_CR_NL);
      }
    };
    const messageHandle = (event) => {
      switch (event.data.type) {
        case VIRTUAL_EVENT_DISCONNECTED:
          disconnect();
          break;
        case 'command':
          // eslint-disable-next-line no-console
          console.log('command', event.data.command);
          executeCommand(event.data.command);
          break;
        default:
        // ignore
      }
    };
    window.addEventListener('message', messageHandle);
    window.addEventListener('beforeunload', disconnect);
    window.opener.postMessage({
      type: VIRTUAL_EVENT_CONNECTED,
    });
    return () => {
      window.removeEventListener('message', messageHandle);
      window.removeEventListener('beforeunload', disconnect);
    };
  }, []);

  return (
    <>
      <div className={classnames(sheetsStyles.root)}>virtual</div>
      <Footer />
    </>
  );
};

export default VirtualPlotter;
