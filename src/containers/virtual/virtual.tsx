import queryString from 'query-string';
import { useEffect, useRef, useState } from 'react';
import {
  VIRTUAL_EVENT_DISCONNECTED,
  VIRTUAL_EVENT_MESSAGE,
  VIRTUAL_EVENT_STARTED,
  VIRTUAL_STATUS_CONNECTED,
  VIRTUAL_STATUS_DISCONNECTED,
} from '@/communication/device/consts';
import type { VMMessage } from '@/communication/device/virtual';
import Footer from '@/components/footer/footer';
import { useToast } from '@/hooks/use-toast';
import Canvas from './components/canvas';
import PenHolder from './components/pen-holder';
import type { IVirtualPlotter } from './plotter';
import createVM from './plotter';
import { logger } from './utils';
import styles from './virtual.module.css';

const VirtualPlotter = () => {
  const { toast } = useToast();
  const [_deviceStatus, setDeviceStatus] = useState(
    VIRTUAL_STATUS_DISCONNECTED,
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const [vm, setVm] = useState<IVirtualPlotter | null>(null);
  const [canvasSize] = useState({ width: 2970, height: 2100 });
  const [transform, setTransform] = useState<{ transform: string } | null>(
    null,
  );
  useEffect(() => {
    const onResize = () => {
      if (!stageRef.current) return;
      const bbox = stageRef.current.getBoundingClientRect();
      const canvasRatio = canvasSize.width / canvasSize.height;
      const stageRatio = bbox.width / bbox.height;
      let [x, y] = [0, 0];
      let scale: number;
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
  }, [canvasSize.height, canvasSize.width]);
  useEffect(() => {
    if (!window.opener) {
      alert('Please open virtual plotter from axidraw web device connector!');
      window.location.href = '/';
      return () => {};
    }
    const opener = window.opener as Window;
    const options = queryString.parse(window.location.search);
    const version = (options.ebb ?? '2.7.0') as string;
    const vm = createVM({
      version,
    });
    const disconnect = () => {
      opener.postMessage({
        type: VIRTUAL_EVENT_DISCONNECTED,
      });
      logger.debug('disconnected.');
      toast({
        title: 'Disconnected',
        description: 'The virtual plotter has been disconnected.',
      });
    };
    const messageHandle = (event: MessageEvent<VMMessage>) => {
      switch (event.data.type) {
        case VIRTUAL_EVENT_DISCONNECTED:
          setDeviceStatus(VIRTUAL_STATUS_DISCONNECTED);
          window.removeEventListener('beforeunload', disconnect);
          disconnect();
          break;
        case 'command':
          logger.debug(`Received command: ${event.data.command}`);
          void vm.execute(event.data.command).then((resp: string) => {
            logger.debug(`Respond: ${resp}`);
            opener.postMessage({
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
    opener.postMessage({
      type: VIRTUAL_EVENT_STARTED,
    });

    logger.debug('connected.');
    // the VM only exists inside this effect (it owns the AudioContext and the
    // window listeners), so its state has to be published from here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeviceStatus(VIRTUAL_STATUS_CONNECTED);
    setVm(vm);

    toast({
      title: 'Ready',
      description: 'Please return to the main window to start plotting.',
    });

    return () => {
      window.removeEventListener('message', messageHandle);
      window.removeEventListener('beforeunload', disconnect);
      vm.destroy();
    };
  }, [toast]);

  return (
    <>
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.frame} style={transform as React.CSSProperties}>
          <div
            className={styles.board}
            style={{ width: canvasSize.width, height: canvasSize.height }}
          />
        </div>
        {vm && (
          <Canvas vm={vm} width={canvasSize.width} height={canvasSize.height} />
        )}
        {vm && (
          <div
            className={styles.plotter}
            style={transform as React.CSSProperties}
          >
            <PenHolder vm={vm} />
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <Footer />
      </div>
    </>
  );
};

export default VirtualPlotter;
