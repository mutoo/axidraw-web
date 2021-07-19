import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { px2mm } from 'math/svg';
import styles from './planning.css';
import PlotterContext from '../../context';
import { PLANNING_PHASE_PLANNING } from '../../presenters/planning';

const Planning = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);

  return (
    <g
      className={classNames(
        styles.root,
        planning.phase === PLANNING_PHASE_PLANNING ? 'block' : 'hidden',
      )}
      style={{ strokeWidth: px2mm(1) }}
      transform={page.pageToScreenMatrix.toString()}
      {...props}
    >
      <path
        style={{
          stroke: '#aaaaaa',
        }}
        d={planning.connectionsAsPathDef}
      />
      <path d={planning.linesAsPathDef} />
    </g>
  );
});

Planning.propTypes = {};

export default Planning;
