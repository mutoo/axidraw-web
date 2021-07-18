import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import styles from './planning.css';
import PlotterContext from '../../context';
import { WORK_PHASE_PLANNING } from '../../presenters/work';

const Planning = observer(({ ...props }) => {
  const { work } = useContext(PlotterContext);
  return (
    <g
      className={classNames(
        styles.root,
        work.phase === WORK_PHASE_PLANNING ? 'block' : 'hidden',
      )}
      {...props}
    >
      <path d={work.linesAsPathDef} />
      <path d={work.connectionsAsPathDef} />
    </g>
  );
});

Planning.propTypes = {};

export default Planning;
