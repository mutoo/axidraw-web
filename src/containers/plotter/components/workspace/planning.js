import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { px2mm } from 'math/svg';
import styles from './planning.css';
import PlotterContext from '../../context';
import {
  PLANNING_PHASE_PLANNING,
  PLANNING_PHASE_PLOTTING,
} from '../../presenters/planning';

const Planning = observer(({ strokeWidth, ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const scale = px2mm(1);
  return (
    <g
      className={classNames(
        styles.root,
        planning.phase === PLANNING_PHASE_PLANNING ||
          planning.phase === PLANNING_PHASE_PLOTTING
          ? 'block'
          : 'hidden',
      )}
      style={{ '--planning-stroke-width': `${strokeWidth * scale}%` }}
      transform={page.pageToScreenMatrix.toString()}
      {...props}
    >
      <path className={styles.motionPenUp} d={planning.connectionsAsPathDef} />
      <path className={styles.motionPenDown} d={planning.linesAsPathDef} />
    </g>
  );
});

Planning.propTypes = {
  strokeWidth: PropTypes.number,
};

export default Planning;
