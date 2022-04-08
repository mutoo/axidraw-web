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
import createVM from './plotter';
import Canvas from './components/canvas';
import styles from './virtual.css';
import PenHolder from './components/pen-holder';

const VirtualPlotter = () => {
  const [deviceStatus, setDeviceStatus] = useState(VIRTUAL_STATUS_DISCONNECTED);
  const stageRef = useRef(null);
  const [plotter, setPlotter] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 2970, height: 2100 });
  const [transform, setTransform] = useState(null);
  useEffect(() => {
    const onResize = () => {
      if (!stageRef.current) return;
      const bbox = stageRef.current.getBoundingClientRect();
      const canvasRatio = canvasSize.width / canvasSize.height;
      const stageRatio = bbox.width / bbox.height;
      let [x, y, scale] = [0, 0, 1];
      if (canvasRatio < stageRatio) {
        scale = bbox.height / canvasSize.height;
        x = (bbox.width - canvasSize.width * scale) / 2;
      } else {
        scale = bbox.width / canvasSize.width;
        y = (bbox.height - canvasSize.height * scale) / 2;
      }
      const matrix = new DOMMatrix();
      matrix.translateSelf(x, y).scaleSelf(scale);
      setTransform({ transform: matrix.toString() });
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);
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

  return (
    <>
      <div className={styles.stage} ref={stageRef}>
        <Canvas
          vm={plotter}
          width={canvasSize.width}
          height={canvasSize.height}
        />
        <div className={styles.plotter} style={transform}>
          <PenHolder vm={plotter} />
        </div>
      </div>
      <div className={styles.footer}>
        <div className={classnames(sheetsStyles.root)}>
          virtual plotter: {deviceStatus}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default VirtualPlotter;
