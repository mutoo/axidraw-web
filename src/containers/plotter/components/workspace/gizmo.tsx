import classNames from 'clsx';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { mm2px } from '@/math/svg';
import { PlotterContext } from '../../context';
import { PAGE_ORIENTATION_PORTRAIT } from '../../presenters/page';
import styles from './gizmo.module.css';

const Gizmo = observer(({ ...props }) => {
  const { page } = useContext(PlotterContext);
  return (
    <g
      className={styles.root}
      transform={
        page.orientation === PAGE_ORIENTATION_PORTRAIT
          ? `translate(${mm2px(page.width)},0) rotate(90) `
          : undefined
      }
      {...props}
    >
      <polyline
        className={classNames(styles.axis, styles.x)}
        points={`0,0 ${mm2px(10)},0 ${mm2px(8)},${mm2px(-2)}`}
      />
      <polyline
        className={classNames(styles.axis, styles.y)}
        points={`0,0 0,${mm2px(10)} ${mm2px(-2)},${mm2px(8)}`}
      />
      <circle className={styles.z} r={mm2px(2)} cx="0" cy="0" />
    </g>
  );
});

export default Gizmo;
