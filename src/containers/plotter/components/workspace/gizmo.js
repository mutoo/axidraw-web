import React, { useContext } from 'react';
import { mm2px } from 'math/svg';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import styles from './gizmo.css';
import { PAGE_ORIENTATION_PORTRAIT } from '../../presenters/page';
import PlotterContext from '../../context';

const Gizmo = observer(({ ...props }) => {
  const { page } = useContext(PlotterContext);
  return (
    <g
      className={styles.root}
      transform={
        page.orientation === PAGE_ORIENTATION_PORTRAIT
          ? `translate(${mm2px(page.width)},0) rotate(90) `
          : null
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

Gizmo.propTypes = {};

export default Gizmo;
