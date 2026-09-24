import classNames from 'clsx';
import { Hand } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import Footer from '@/components/footer/footer';
import { aaSteps2xyDist } from '@/math/ebb';
import type { VirtualAxiDraw } from '../axidraw';
import { isFreeMode, PEN_DOWN, penPosition } from '../plotter/utils';
import styles from './status-bar.module.css';

// in mm, and never "-0.0"
const mm = (value: number) => (Math.abs(value) < 0.05 ? 0 : value).toFixed(1);

const StatusBar = observer(({ axidraw }: { axidraw: VirtualAxiDraw }) => {
  const { context } = axidraw.vm;
  const { x, y } = aaSteps2xyDist(penPosition(context));
  const penDown = context.pen === PEN_DOWN;
  const free = isFreeMode(context);
  return (
    <footer className={styles.root}>
      <div className={styles.readout}>
        <span>EBB v{context.version}</span>
        <span>X {mm(x)} mm</span>
        <span>Y {mm(y)} mm</span>
        <span>Pen {penDown ? 'down' : 'up'}</span>
        {free ? (
          <span
            className={classNames(styles.mode, styles.free)}
            title="Drag the carriage, or press the arrow keys (with Shift for 10 mm)"
          >
            <Hand />
            Free: move the carriage by hand
          </span>
        ) : (
          <span className={styles.mode}>
            {context.idle ? 'Idle' : 'Controlled by the main window'}
          </span>
        )}
      </div>
      <Footer compact />
    </footer>
  );
});

export default StatusBar;
