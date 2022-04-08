import React, { useEffect, useRef, useState } from 'react';
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
import { reaction } from 'mobx';
import createVM from './plotter';
import { aa2xy, aaSteps2xyDist } from '../../math/ebb';

const VirtualPlotter = () => {
  const [deviceStatus, setDeviceStatus] = useState(VIRTUAL_STATUS_DISCONNECTED);
  const [plotter, setPlotter] = useState(null);
  const canvas = useRef(null);
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

  useEffect(() => {
    if (!plotter) return () => {};
    const vmCtx = plotter.context;
    const canvasCtx = canvas.current.getContext('2d');
    let prevX = 0;
    let prevY = 0;

    return reaction(
      () => [vmCtx.motor.a1, vmCtx.motor.a2],
      ([a1, a2]) => {
        const { x, y } = aaSteps2xyDist({ a1, a2 }, vmCtx.motor.m1);
        canvasCtx.beginPath();
        if (vmCtx.pen === 0) {
          canvasCtx.moveTo(prevX, prevY);
          canvasCtx.lineTo(x, y);
          canvasCtx.stroke();
        }
        prevX = x;
        prevY = y;
      },
    );
  }, [plotter]);

  return (
    <>
      <div className={classnames(sheetsStyles.root)}>
        <canvas ref={canvas} width={297} height={210} />
        virtual plotter: {deviceStatus}
      </div>
      <Footer />
    </>
  );
};

export default VirtualPlotter;
