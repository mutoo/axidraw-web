import React, { useContext, useState } from 'react';
import { mm2px } from 'math/svg';
import { observer } from 'mobx-react-lite';
import { preventDefault } from 'utils/dom-event';
import classNames from 'classnames';
import styles from './page.css';
import PlotterContext from '../../context';

const Page = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const paddingPx = mm2px(page.padding);
  const [dropping, setDropping] = useState(false);
  return (
    <g
      onDragOver={preventDefault()}
      onDragEnter={preventDefault(() => setDropping(true))}
      onDragLeave={preventDefault(() => setDropping(false))}
      onDrop={preventDefault((e) => {
        setDropping(false);
        if (!e.dataTransfer.files.length) {
          return;
        }
        const svgFile = Array.from(e.dataTransfer.files).find(
          (file) => file.type === 'image/svg+xml',
        );
        if (!svgFile) {
          // eslint-disable-next-line no-alert
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
