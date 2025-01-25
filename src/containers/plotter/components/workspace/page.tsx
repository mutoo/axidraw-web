import classNames from 'clsx';
import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';
import { mm2px } from '@/math/svg';
import { preventDefault } from '@/utils/dom-event';
import { PlotterContext } from '../../context';
import { PLANNING_PHASE } from '../../presenters/planning';
import styles from './page.module.css';

const Page = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const paddingPx = mm2px(page.padding);
  const [dropping, setDropping] = useState(false);
  return (
    <g
      onDragOver={preventDefault()}
      onDragEnter={preventDefault(() => {
        setDropping(planning.phase === PLANNING_PHASE.SETUP);
      })}
      onDragLeave={preventDefault(() => {
        setDropping(false);
      })}
      onDrop={preventDefault((e: DragEvent) => {
        if (planning.phase !== PLANNING_PHASE.SETUP) {
          return;
        }
        setDropping(false);
        if (!e.dataTransfer?.files.length) {
          return;
        }
        const svgFile = Array.from(e.dataTransfer.files).find(
          (file) => file.type === 'image/svg+xml',
        );
        if (!svgFile) {
          alert('Only SVG files are supported.');
          return;
        }
        planning.loadFromFile(svgFile);
      })}
      {...props}
    >
      <rect
        className={styles.shadow}
        width={widthPx}
        height={heightPx}
        filter="url(#svgShadow)"
      />
      <rect
        className={classNames(styles.paper, { [styles.dropping]: dropping })}
        width={widthPx}
        height={heightPx}
      />
      <rect
        className={styles.printable}
        width={widthPx - paddingPx * 2}
        height={heightPx - paddingPx * 2}
        x={paddingPx}
        y={paddingPx}
      />
    </g>
  );
});

Page.propTypes = {};

export default Page;
